"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { ensureCategoryByName, generateExpenseTransactionNo } from "@/actions/finance/_shared"
import { FINANCE_SOURCE } from "@/lib/finance"
import { validateFieldValue } from "@/lib/reportValidation"
import { syncExpenseJournalEntry } from "@/lib/ledger"
import { paginate, parseListQuery, withTiebreak, type SortDir } from "@/lib/listQuery"
import type { Prisma } from "@prisma/client"

const PRODUCTION_SORT_KEYS = ["date", "status", "totalInput", "totalOutput"] as const
type ProductionSortKey = (typeof PRODUCTION_SORT_KEYS)[number]

function productionOrderBy(sort: ProductionSortKey, dir: SortDir) {
  const primary: Record<ProductionSortKey, Prisma.ProductionBatchOrderByWithRelationInput> = {
    date: { productionDate: dir },
    status: { status: dir },
    totalInput: { totalInput: dir },
    totalOutput: { totalOutput: dir },
  }
  return withTiebreak(primary[sort], dir)
}

type Line = { productId: string; quantity: number }
type OutputLine = Line & { rate: number }
type ReportEntryInput = { templateId: string; values: { templateFieldId: string; value: string }[] }

function parseReportEntries(formData: FormData): ReportEntryInput[] {
  const raw = String(formData.get("reports") || "").trim()
  if (!raw) return []
  try {
    return JSON.parse(raw) as ReportEntryInput[]
  } catch {
    throw new Error("Invalid report data")
  }
}

async function requireProductionAccess() {
  const session = await auth()
  if (!session?.user?.role || !["ADMIN", "ANALYST", "MILL_OWNER"].includes(session.user.role))
    throw new Error("Unauthorized")
  return session.user.id as string
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim()
}

function parseLines<T>(formData: FormData, key: string): T[] {
  try {
    return JSON.parse(text(formData, key)) as T[]
  } catch {
    throw new Error(`${key} are required`)
  }
}

function batchNumber() {
  return `PB-${Date.now().toString().slice(-8)}`
}

export async function getProductionBatchSetup() {
  await requireProductionAccess()
  return Promise.all([
    prisma.godown.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, type: true, unit: { select: { symbol: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.reportTemplate.findMany({
      where: { isActive: true, attachTo: "PRODUCTION" },
      select: {
        id: true,
        name: true,
        description: true,
        fields: {
          select: { id: true, name: true, type: true, section: true, isRequired: true, orderIndex: true },
          orderBy: { orderIndex: "asc" },
        },
      },
      orderBy: { name: "asc" },
    }),
  ])
}

export async function getProductionBatches(params: {
  status?: string
  page?: string
  sort?: string
  dir?: string
} = {}) {
  await requireProductionAccess()
  const status = params.status || "ALL"
  const whereClause = status !== "ALL" ? { status } : undefined

  const { sort, dir } = parseListQuery(params, {
    allowedSorts: PRODUCTION_SORT_KEYS,
    defaultSort: "date",
    defaultDir: "desc",
  })
  const orderBy = productionOrderBy(sort, dir)

  const result = await paginate(
    () => prisma.productionBatch.count({ where: whereClause }),
    ({ skip, take }) =>
      prisma.productionBatch.findMany({
        where: whereClause,
        include: {
          inputGodown: true,
          outputGodown: true,
          inputs: { include: { product: { include: { unit: true } } } },
          outputs: { include: { product: { include: { unit: true } } } },
        },
        orderBy,
        skip,
        take,
      }),
    Number(params.page) || 1,
  )

  return { ...result, sort, dir }
}

export async function createProductionBatch(formData: FormData) {
  const userId = await requireProductionAccess()
  const productionDate = new Date(text(formData, "productionDate"))
  const inputGodownId = text(formData, "inputGodownId")
  const outputGodownId = text(formData, "outputGodownId")
  const status = text(formData, "status") || "DRAFT"
  const notes = text(formData, "notes") || null
  const totalCost = Number(text(formData, "totalCost") || 0)
  const inputs = parseLines<Line>(formData, "inputs")
  const outputs = parseLines<OutputLine>(formData, "outputs")
  const reportEntries = parseReportEntries(formData)

  if (
    Number.isNaN(productionDate.getTime()) ||
    !inputGodownId ||
    !outputGodownId ||
    !inputs.length ||
    !outputs.length
  )
    throw new Error("Date, godowns, inputs, and outputs are required")
  if (!["DRAFT", "IN_PROGRESS", "COMPLETED", "CANCELLED"].includes(status))
    throw new Error("Invalid production status")
  if (
    !Number.isFinite(totalCost) ||
    totalCost < 0 ||
    inputs.some(
      (line) => !line.productId || !Number.isFinite(line.quantity) || line.quantity <= 0,
    ) ||
    outputs.some(
      (line) =>
        !line.productId ||
        !Number.isFinite(line.quantity) ||
        line.quantity <= 0 ||
        !Number.isFinite(line.rate) ||
        line.rate <= 0,
    )
  )
    throw new Error("All quantities, rates, and costs must be valid positive numbers")

  const productIds = [...new Set([...inputs, ...outputs].map((line) => line.productId))]
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
  })
  if (products.length !== productIds.length) throw new Error("One or more products are unavailable")

  // The processing cost only ever becomes an expense when the batch actually completes and
  // posts stock — a DRAFT/IN_PROGRESS batch hasn't incurred it yet as far as the books are concerned.
  const postsExpense = status === "COMPLETED" && totalCost > 0
  const processingCategory = postsExpense ? await ensureCategoryByName("Processing") : null
  const expenseTransactionNo = postsExpense ? await generateExpenseTransactionNo() : null

  const inputUnitCosts = new Map<string, number>()

  await prisma.$transaction(async (tx) => {
    if (status === "COMPLETED") {
      for (const line of inputs) {
        const movements = await tx.stockMovement.findMany({
          where: { productId: line.productId, godownId: inputGodownId },
          select: { quantityIn: true, quantityOut: true, unitCost: true },
        })
        let balance = 0
        let value = 0
        for (const movement of movements) {
          const quantityIn = Number(movement.quantityIn)
          const quantityOut = Number(movement.quantityOut)
          const unitCost = movement.unitCost ? Number(movement.unitCost) : 0
          balance += quantityIn - quantityOut
          if (quantityIn > 0) value += quantityIn * unitCost
          if (quantityOut > 0) value -= Math.min(value, quantityOut * unitCost)
        }
        if (balance < line.quantity)
          throw new Error(
            `Insufficient stock for ${products.find((product) => product.id === line.productId)?.name || "input product"}`,
          )
        inputUnitCosts.set(line.productId, balance > 0 ? value / balance : 0)
      }
    }

    // The value of the raw material just consumed becomes part of what the outputs are worth —
    // without it, the paddy's cost would vanish from the books the moment it's processed.
    const paddyValueConsumed = inputs.reduce(
      (sum, line) => sum + line.quantity * (inputUnitCosts.get(line.productId) ?? 0),
      0,
    )
    const costPool = paddyValueConsumed + totalCost

    const totalOutputQty = outputs.reduce((sum, line) => sum + line.quantity, 0)
    const outputWeights = outputs.map((line) => line.quantity * (line.rate || 0))
    const totalWeight = outputWeights.reduce((sum, weight) => sum + weight, 0)

    // Split the cost pool across outputs proportional to relative value (qty * rate), so a
    // byproduct like husk doesn't absorb the same per-unit cost as the rice it came from.
    const outputUnitCosts = outputs.map((line, index) => {
      const share =
        totalWeight > 0
          ? costPool * (outputWeights[index] / totalWeight)
          : costPool * (line.quantity / Math.max(totalOutputQty, 1))
      return line.quantity > 0 ? share / line.quantity : 0
    })

    const batch = await tx.productionBatch.create({
      data: {
        batchNo: batchNumber(),
        productionDate,
        inputGodownId,
        outputGodownId,
        status,
        totalInput: inputs.reduce((sum, line) => sum + line.quantity, 0),
        totalOutput: totalOutputQty,
        totalCost,
        notes,
        inputs: {
          create: inputs.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
            unitCost: inputUnitCosts.get(line.productId) ?? null,
          })),
        },
        outputs: {
          create: outputs.map((line, index) => ({
            productId: line.productId,
            quantity: line.quantity,
            unitCost: outputUnitCosts[index],
          })),
        },
        costs: { create: totalCost > 0 ? [{ label: "Production Cost", amount: totalCost }] : [] },
      },
    })

    if (status === "COMPLETED") {
      const movements = [
        ...inputs.map((line) => ({
          productId: line.productId,
          godownId: inputGodownId,
          quantityIn: 0,
          quantityOut: line.quantity,
          unitCost: inputUnitCosts.get(line.productId) ?? 0,
          sourceType: "PRODUCTION_INPUT",
          sourceId: batch.id,
          occurredAt: productionDate,
        })),
        ...outputs.map((line, index) => ({
          productId: line.productId,
          godownId: outputGodownId,
          quantityIn: line.quantity,
          quantityOut: 0,
          unitCost: outputUnitCosts[index],
          sourceType: "PRODUCTION_OUTPUT",
          sourceId: batch.id,
          occurredAt: productionDate,
        })),
      ]
      await tx.stockMovement.createMany({ data: movements })
    }

    // Only the processing cost (labor, etc.) is expensed here — the paddy's own cost was already
    // recorded once as a Purchase and must not be counted a second time.
    if (postsExpense && processingCategory && expenseTransactionNo) {
      const processingExpense = await tx.expense.create({
        data: {
          transactionNo: expenseTransactionNo,
          date: productionDate,
          categoryId: processingCategory.id,
          amount: totalCost,
          paymentMethod: "Bank Transfer",
          description: `Processing cost for batch ${batch.batchNo}`,
          notes: `Auto-posted from production batch ${batch.batchNo}`,
          sourceType: FINANCE_SOURCE.PRODUCTION_PROCESSING,
          sourceId: batch.id,
          createdById: userId,
        },
      })
      await syncExpenseJournalEntry(tx, processingExpense.id)
    }

    for (const entry of reportEntries) {
      const template = await tx.reportTemplate.findFirst({
        where: { id: entry.templateId, isActive: true, attachTo: "PRODUCTION" },
        include: { fields: { orderBy: { orderIndex: "asc" } } },
      })
      if (!template) continue
      const valuesByFieldId = new Map(entry.values.map((v) => [v.templateFieldId, v.value]))
      const values = template.fields.map((field) => {
        const raw = valuesByFieldId.get(field.id) ?? ""
        validateFieldValue(raw, field)
        return { templateFieldId: field.id, value: raw.trim() }
      })
      await tx.report.create({
        data: {
          templateId: template.id,
          productionBatchId: batch.id,
          analystId: userId,
          status: "DRAFT",
          values: { create: values },
        },
      })
    }
  })

  revalidatePath("/dashboard/production")
  revalidatePath("/dashboard/stock")
  revalidatePath("/dashboard/finance")
  revalidatePath("/dashboard/reports")
  revalidatePath("/dashboard/finance/expenses")
  revalidatePath("/dashboard")
  redirect("/dashboard/production")
}

export async function updateProductionBatchStatus(id: string, status: string) {
  await requireProductionAccess()
  if (!["DRAFT", "IN_PROGRESS", "CANCELLED"].includes(status))
    throw new Error("Use completion through the production workflow")
  await prisma.productionBatch.update({ where: { id }, data: { status } })
  revalidatePath("/dashboard/production")
}
