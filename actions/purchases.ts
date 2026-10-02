"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { randomUUID } from "crypto"
import { validateFieldValue } from "@/lib/reportValidation"
import {
  LEDGER_ACCOUNTS,
  LEDGER_SOURCE,
  deleteJournalEntry,
  postJournalEntry,
  resolveCashOrBankAccount,
} from "@/lib/ledger"
import { paginate, parseListQuery, withTiebreak, type SortDir } from "@/lib/listQuery"
import type { Prisma } from "@prisma/client"

const PURCHASE_SORT_KEYS = ["date", "supplier", "total", "status"] as const
type PurchaseSortKey = (typeof PURCHASE_SORT_KEYS)[number]

function purchaseOrderBy(sort: PurchaseSortKey, dir: SortDir) {
  const primary: Record<PurchaseSortKey, Prisma.PurchaseOrderByWithRelationInput> = {
    date: { purchaseDate: dir },
    supplier: { supplier: { name: dir } },
    total: { totalAmount: dir },
    status: { status: dir },
  }
  return withTiebreak(primary[sort], dir)
}

type PurchaseLineInput = { id?: string; productId: string; quantity: number; unitRate: number }
type ReportEntryInput = { templateId: string; values: { templateFieldId: string; value: string }[] }

async function requireAdmin() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")
  return session.user.id as string
}

function parseReportEntries(formData: FormData): ReportEntryInput[] {
  const raw = String(formData.get("reports") || "").trim()
  if (!raw) return []
  try {
    return JSON.parse(raw) as ReportEntryInput[]
  } catch {
    throw new Error("Invalid report data")
  }
}

function value(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim()
}

function generatePurchaseNo() {
  return `PUR-${Date.now().toString().slice(-8)}`
}

function generateLotNumber() {
  return `LOT-${Date.now().toString().slice(-8)}`
}

export async function getPurchaseSetup() {
  await requireAdmin()
  return Promise.all([
    prisma.supplier.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, type: true, unit: { select: { symbol: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.godown.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.mill.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.reportTemplate.findMany({
      where: { isActive: true, attachTo: "PURCHASE" },
      select: {
        id: true,
        name: true,
        description: true,
        appliesToProductType: true,
        fields: {
          select: { id: true, name: true, type: true, section: true, isRequired: true, orderIndex: true },
          orderBy: { orderIndex: "asc" },
        },
      },
      orderBy: { name: "asc" },
    }),
  ])
}

export async function getPurchases(params: {
  query?: string
  status?: string
  page?: string
  sort?: string
  dir?: string
} = {}) {
  await requireAdmin()

  const query = params.query?.trim() || ""
  const status = params.status || "ALL"
  const whereClause: Prisma.PurchaseWhereInput = {
    ...(status !== "ALL" ? { status } : {}),
    ...(query
      ? {
          OR: [
            { purchaseNo: { contains: query, mode: "insensitive" } },
            { invoiceNumber: { contains: query, mode: "insensitive" } },
            { supplier: { name: { contains: query, mode: "insensitive" } } },
          ],
        }
      : {}),
  }

  const { sort, dir } = parseListQuery(params, {
    allowedSorts: PURCHASE_SORT_KEYS,
    defaultSort: "date",
    defaultDir: "desc",
  })
  const orderBy = purchaseOrderBy(sort, dir)

  const result = await paginate(
    () => prisma.purchase.count({ where: whereClause }),
    ({ skip, take }) =>
      prisma.purchase.findMany({
        where: whereClause,
        include: { supplier: true, godown: true },
        orderBy,
        skip,
        take,
      }),
    Number(params.page) || 1,
  )

  return { ...result, sort, dir }
}

export async function getPurchase(id: string) {
  await requireAdmin()
  return prisma.purchase.findUnique({
    where: { id },
    include: {
      supplier: true,
      godown: { include: { unit: true } },
      lines: { include: { product: { include: { unit: true } }, paddyLot: true } },
      reports: { include: { template: { select: { name: true } } } },
    },
  })
}

async function stockBalance(productId: string, godownId: string) {
  const movements = await prisma.stockMovement.findMany({
    where: { productId, godownId },
    select: { quantityIn: true, quantityOut: true },
  })
  return movements.reduce(
    (sum, movement) => sum + Number(movement.quantityIn) - Number(movement.quantityOut),
    0,
  )
}

export async function getPurchaseEditability(id: string) {
  await requireAdmin()
  const purchase = await prisma.purchase.findUnique({
    where: { id },
    include: { lines: { include: { product: true } } },
  })
  if (!purchase) throw new Error("Purchase not found")

  const lockedLines: {
    productId: string
    productName: string
    purchasedQty: number
    currentBalance: number
  }[] = []
  for (const line of purchase.lines) {
    const currentBalance = await stockBalance(line.productId, purchase.godownId)
    if (currentBalance < Number(line.quantity)) {
      lockedLines.push({
        productId: line.productId,
        productName: line.product.name,
        purchasedQty: Number(line.quantity),
        currentBalance,
      })
    }
  }
  return { locked: lockedLines.length > 0, lockedLines }
}

export async function createPurchase(formData: FormData) {
  const userId = await requireAdmin()

  const supplierId = value(formData, "supplierId")
  const godownId = value(formData, "godownId")
  const millId = value(formData, "millId") || null
  const purchaseDate = new Date(value(formData, "purchaseDate"))
  const invoiceNumber = value(formData, "invoiceNumber") || null
  const transportCost = Number(value(formData, "transportCost") || 0)
  const otherCost = Number(value(formData, "otherCost") || 0)
  const paidAmount = Number(value(formData, "paidAmount") || 0)
  const paymentMethod = value(formData, "paymentMethod") || "CASH"
  const notes = value(formData, "notes") || null
  let lines: PurchaseLineInput[]

  try {
    lines = JSON.parse(value(formData, "lines")) as PurchaseLineInput[]
  } catch {
    throw new Error("Purchase products are required")
  }
  const reportEntries = parseReportEntries(formData)

  if (!supplierId || !godownId || Number.isNaN(purchaseDate.getTime()) || !lines.length)
    throw new Error("Supplier, date, godown, and at least one product are required")
  if (
    ![transportCost, otherCost, paidAmount].every(
      (amount) => Number.isFinite(amount) && amount >= 0,
    )
  )
    throw new Error("Costs and payment must be valid non-negative numbers")
  if (
    lines.some(
      (line) =>
        !line.productId ||
        !Number.isFinite(line.quantity) ||
        line.quantity <= 0 ||
        !Number.isFinite(line.unitRate) ||
        line.unitRate < 0,
    )
  )
    throw new Error("Every product line needs a valid quantity and rate")

  const products = await prisma.product.findMany({
    where: { id: { in: lines.map((line) => line.productId) }, isActive: true },
  })
  if (products.length !== lines.length)
    throw new Error("One or more selected products are unavailable")

  const itemsTotal = lines.reduce((sum, line) => sum + line.quantity * line.unitRate, 0)
  const totalAmount = itemsTotal + transportCost + otherCost
  if (paidAmount > totalAmount) throw new Error("Paid amount cannot exceed the grand total")
  const status = paidAmount === 0 ? "UNPAID" : paidAmount < totalAmount ? "PARTIAL" : "PAID"
  const lineIds = lines.map(() => randomUUID())

  await prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.create({
      data: {
        purchaseNo: generatePurchaseNo(),
        invoiceNumber,
        supplierId,
        godownId,
        millId,
        purchaseDate,
        status,
        totalAmount,
        paidAmount,
        paymentMethod,
        transportCost,
        otherCost,
        notes,
        lines: {
          create: lines.map((line, index) => ({
            id: lineIds[index],
            productId: line.productId,
            quantity: line.quantity,
            unitRate: line.unitRate,
            lineTotal: line.quantity * line.unitRate,
            receivedQty: line.quantity,
          })),
        },
      },
    })

    await postJournalEntry(tx, {
      sourceType: LEDGER_SOURCE.PURCHASE,
      sourceId: purchase.id,
      date: purchaseDate,
      description: `Purchase ${purchase.purchaseNo}`,
      lines: [
        { accountCode: LEDGER_ACCOUNTS.INVENTORY.code, debit: totalAmount },
        { accountCode: LEDGER_ACCOUNTS.AP.code, credit: totalAmount },
      ],
    })
    if (paidAmount > 0) {
      await postJournalEntry(tx, {
        sourceType: LEDGER_SOURCE.PURCHASE_PAYMENT,
        sourceId: purchase.id,
        date: purchaseDate,
        description: `Payment for Purchase ${purchase.purchaseNo}`,
        lines: [
          { accountCode: LEDGER_ACCOUNTS.AP.code, debit: paidAmount },
          { accountCode: resolveCashOrBankAccount(paymentMethod), credit: paidAmount },
        ],
      })
    }

    const paddyLotIdByProductType = new Map<string, string>()

    for (const [index, line] of lines.entries()) {
      await tx.stockMovement.create({
        data: {
          productId: line.productId,
          godownId,
          quantityIn: line.quantity,
          quantityOut: 0,
          unitCost: line.unitRate,
          sourceType: "PURCHASE",
          sourceId: purchase.id,
          occurredAt: purchaseDate,
        },
      })
      const product = products.find((item) => item.id === line.productId)
      if (millId && product?.type === "RAW_MATERIAL") {
        const paddyLot = await tx.paddyLot.create({
          data: {
            lotNumber: generateLotNumber(),
            millId,
            supplierId,
            productId: line.productId,
            purchaseLineId: lineIds[index],
            supplierName: "Linked supplier",
            variety: product.name,
            cropYear: String(purchaseDate.getFullYear()),
            purchaseDate,
            weight: line.quantity,
            moisture: 0,
            purchaseRate: line.unitRate,
            status: "OPEN",
          },
        })
        if (!paddyLotIdByProductType.has(product.type)) {
          paddyLotIdByProductType.set(product.type, paddyLot.id)
        }
      }
    }

    for (const entry of reportEntries) {
      const template = await tx.reportTemplate.findFirst({
        where: { id: entry.templateId, isActive: true, attachTo: "PURCHASE" },
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
          purchaseId: purchase.id,
          paddyLotId: template.appliesToProductType
            ? paddyLotIdByProductType.get(template.appliesToProductType) ?? null
            : null,
          analystId: userId,
          status: "DRAFT",
          values: { create: values },
        },
      })
    }
  })

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/purchases")
  revalidatePath("/dashboard/lots")
  revalidatePath("/dashboard/stock")
  revalidatePath("/dashboard/reports")
  redirect("/dashboard/purchases")
}

export async function updatePurchase(formData: FormData) {
  await requireAdmin()

  const id = value(formData, "id")
  const supplierId = value(formData, "supplierId")
  const godownId = value(formData, "godownId")
  const millId = value(formData, "millId") || null
  const purchaseDate = new Date(value(formData, "purchaseDate"))
  const invoiceNumber = value(formData, "invoiceNumber") || null
  const transportCost = Number(value(formData, "transportCost") || 0)
  const otherCost = Number(value(formData, "otherCost") || 0)
  const paidAmount = Number(value(formData, "paidAmount") || 0)
  const paymentMethod = value(formData, "paymentMethod") || "CASH"
  const notes = value(formData, "notes") || null
  let submittedLines: PurchaseLineInput[]

  try {
    submittedLines = JSON.parse(value(formData, "lines")) as PurchaseLineInput[]
  } catch {
    throw new Error("Purchase products are required")
  }

  if (!id || !supplierId) throw new Error("Supplier is required")
  if (
    ![transportCost, otherCost, paidAmount].every(
      (amount) => Number.isFinite(amount) && amount >= 0,
    )
  )
    throw new Error("Costs and payment must be valid non-negative numbers")

  const existing = await prisma.purchase.findUnique({
    where: { id },
    include: { lines: { include: { paddyLot: true } } },
  })
  if (!existing) throw new Error("Purchase not found")

  // Recomputed fresh from DB state on every write — the client's lock status is never trusted.
  const editability = await getPurchaseEditability(id)

  // When locked, the godown/date/line-item inputs are disabled in the UI, so browsers omit them
  // from the submission entirely — ignore whatever (if anything) was submitted for them and keep
  // the purchase's existing stock-affecting data exactly as-is; only header/payment fields below
  // are allowed to change.
  const lines: PurchaseLineInput[] = editability.locked
    ? existing.lines.map((line) => ({
        id: line.id,
        productId: line.productId,
        quantity: Number(line.quantity),
        unitRate: Number(line.unitRate),
      }))
    : submittedLines
  const effectiveGodownId = editability.locked ? existing.godownId : godownId
  const effectivePurchaseDate = editability.locked ? existing.purchaseDate : purchaseDate
  const effectiveMillId = editability.locked ? existing.millId : millId

  if (!editability.locked) {
    if (!effectiveGodownId || Number.isNaN(effectivePurchaseDate.getTime()) || !lines.length)
      throw new Error("Supplier, date, godown, and at least one product are required")
    if (
      lines.some(
        (line) =>
          !line.productId ||
          !Number.isFinite(line.quantity) ||
          line.quantity <= 0 ||
          !Number.isFinite(line.unitRate) ||
          line.unitRate < 0,
      )
    )
      throw new Error("Every product line needs a valid quantity and rate")
  }

  const products = await prisma.product.findMany({
    where: { id: { in: lines.map((line) => line.productId) }, isActive: true },
  })
  if (products.length !== new Set(lines.map((line) => line.productId)).size)
    throw new Error("One or more selected products are unavailable")

  const itemsTotal = lines.reduce((sum, line) => sum + line.quantity * line.unitRate, 0)
  const totalAmount = itemsTotal + transportCost + otherCost
  if (paidAmount > totalAmount) throw new Error("Paid amount cannot exceed the grand total")
  const status = paidAmount === 0 ? "UNPAID" : paidAmount < totalAmount ? "PARTIAL" : "PAID"

  await prisma.$transaction(async (tx) => {
    if (!editability.locked) {
      const existingLineMap = new Map(existing.lines.map((line) => [line.id, line]))
      const submittedIds = new Set(lines.filter((line) => line.id).map((line) => line.id))

      for (const oldLine of existing.lines) {
        if (submittedIds.has(oldLine.id)) continue
        if (oldLine.paddyLot) {
          const linkedCounts = await tx.paddyLot.findUnique({
            where: { id: oldLine.paddyLot.id },
            include: {
              _count: { select: { reports: true, financeIncomes: true, financeExpenses: true } },
              productionOutput: true,
            },
          })
          if (
            linkedCounts &&
            (linkedCounts._count.reports > 0 ||
              linkedCounts._count.financeIncomes > 0 ||
              linkedCounts._count.financeExpenses > 0 ||
              linkedCounts.productionOutput)
          )
            throw new Error(
              `Cannot remove the ${oldLine.productId} line: its paddy lot has linked reports, production output, or finance records`,
            )
          await tx.paddyLot.delete({ where: { id: oldLine.paddyLot.id } })
        }
        await tx.stockMovement.deleteMany({
          where: { sourceType: "PURCHASE", sourceId: id, productId: oldLine.productId },
        })
        await tx.purchaseLine.delete({ where: { id: oldLine.id } })
      }

      for (const line of lines) {
        const oldLine = line.id ? existingLineMap.get(line.id) : undefined
        if (oldLine) {
          await tx.purchaseLine.update({
            where: { id: oldLine.id },
            data: {
              productId: line.productId,
              quantity: line.quantity,
              unitRate: line.unitRate,
              lineTotal: line.quantity * line.unitRate,
              receivedQty: line.quantity,
            },
          })
          await tx.stockMovement.updateMany({
            where: { sourceType: "PURCHASE", sourceId: id, productId: oldLine.productId },
            data: {
              productId: line.productId,
              godownId: effectiveGodownId,
              quantityIn: line.quantity,
              unitCost: line.unitRate,
              occurredAt: effectivePurchaseDate,
            },
          })
          if (oldLine.paddyLot) {
            await tx.paddyLot.update({
              where: { id: oldLine.paddyLot.id },
              data: {
                weight: line.quantity,
                purchaseRate: line.unitRate,
                purchaseDate: effectivePurchaseDate,
              },
            })
          }
        } else {
          const newLineId = randomUUID()
          await tx.purchaseLine.create({
            data: {
              id: newLineId,
              purchaseId: id,
              productId: line.productId,
              quantity: line.quantity,
              unitRate: line.unitRate,
              lineTotal: line.quantity * line.unitRate,
              receivedQty: line.quantity,
            },
          })
          await tx.stockMovement.create({
            data: {
              productId: line.productId,
              godownId: effectiveGodownId,
              quantityIn: line.quantity,
              quantityOut: 0,
              unitCost: line.unitRate,
              sourceType: "PURCHASE",
              sourceId: id,
              occurredAt: effectivePurchaseDate,
            },
          })
          const product = products.find((item) => item.id === line.productId)
          if (effectiveMillId && product?.type === "RAW_MATERIAL") {
            await tx.paddyLot.create({
              data: {
                lotNumber: generateLotNumber(),
                millId: effectiveMillId,
                supplierId,
                productId: line.productId,
                purchaseLineId: newLineId,
                supplierName: "Linked supplier",
                variety: product.name,
                cropYear: String(effectivePurchaseDate.getFullYear()),
                purchaseDate: effectivePurchaseDate,
                weight: line.quantity,
                moisture: 0,
                purchaseRate: line.unitRate,
                status: "OPEN",
              },
            })
          }
        }
      }
    }

    await tx.purchase.update({
      where: { id },
      data: {
        invoiceNumber,
        supplierId,
        godownId: effectiveGodownId,
        millId: effectiveMillId,
        purchaseDate: effectivePurchaseDate,
        status,
        totalAmount,
        paidAmount,
        paymentMethod,
        transportCost,
        otherCost,
        notes,
      },
    })

    await postJournalEntry(tx, {
      sourceType: LEDGER_SOURCE.PURCHASE,
      sourceId: id,
      date: effectivePurchaseDate,
      description: `Purchase ${existing.purchaseNo}`,
      lines: [
        { accountCode: LEDGER_ACCOUNTS.INVENTORY.code, debit: totalAmount },
        { accountCode: LEDGER_ACCOUNTS.AP.code, credit: totalAmount },
      ],
    })
    if (paidAmount > 0) {
      await postJournalEntry(tx, {
        sourceType: LEDGER_SOURCE.PURCHASE_PAYMENT,
        sourceId: id,
        date: effectivePurchaseDate,
        description: `Payment for Purchase ${existing.purchaseNo}`,
        lines: [
          { accountCode: LEDGER_ACCOUNTS.AP.code, debit: paidAmount },
          { accountCode: resolveCashOrBankAccount(paymentMethod), credit: paidAmount },
        ],
      })
    } else {
      await deleteJournalEntry(tx, LEDGER_SOURCE.PURCHASE_PAYMENT, id)
    }
  })

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/purchases")
  revalidatePath(`/dashboard/purchases/${id}`)
  revalidatePath("/dashboard/lots")
  revalidatePath("/dashboard/stock")
  redirect(`/dashboard/purchases/${id}`)
}

export async function updatePurchasePayment(formData: FormData) {
  await requireAdmin()
  const id = value(formData, "id")
  const paidAmount = Number(value(formData, "paidAmount"))
  const paymentMethod = value(formData, "paymentMethod") || "CASH"
  const purchase = await prisma.purchase.findUnique({ where: { id } })
  if (
    !purchase ||
    !Number.isFinite(paidAmount) ||
    paidAmount < 0 ||
    paidAmount > Number(purchase.totalAmount)
  )
    throw new Error("Invalid payment amount")
  const status =
    paidAmount === 0 ? "UNPAID" : paidAmount < Number(purchase.totalAmount) ? "PARTIAL" : "PAID"
  await prisma.$transaction(async (tx) => {
    await tx.purchase.update({ where: { id }, data: { paidAmount, paymentMethod, status } })
    if (paidAmount > 0) {
      await postJournalEntry(tx, {
        sourceType: LEDGER_SOURCE.PURCHASE_PAYMENT,
        sourceId: id,
        date: purchase.purchaseDate,
        description: `Payment for Purchase ${purchase.purchaseNo}`,
        lines: [
          { accountCode: LEDGER_ACCOUNTS.AP.code, debit: paidAmount },
          { accountCode: resolveCashOrBankAccount(paymentMethod), credit: paidAmount },
        ],
      })
    } else {
      await deleteJournalEntry(tx, LEDGER_SOURCE.PURCHASE_PAYMENT, id)
    }
  })
  revalidatePath("/dashboard/purchases")
  revalidatePath(`/dashboard/purchases/${id}`)
  revalidatePath("/dashboard")
}
