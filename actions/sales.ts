"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { generateIncomeTransactionNo } from "@/actions/finance/_shared"
import { FINANCE_SOURCE } from "@/lib/finance"
import { getAverageUnitCost } from "@/lib/stock"
import {
  LEDGER_ACCOUNTS,
  LEDGER_SOURCE,
  deleteJournalEntry,
  postJournalEntry,
  resolveCashOrBankAccount,
} from "@/lib/ledger"
import { paginate, parseListQuery, withTiebreak, type SortDir } from "@/lib/listQuery"
import type { Prisma } from "@prisma/client"

type SaleLineInput = { productId: string; quantity: number; unitRate: number }

const ALLOWED_TAX_RATES = [0, 0.25, 1.25] as const

const SALE_SORT_KEYS = ["date", "customer", "total", "status"] as const
type SaleSortKey = (typeof SALE_SORT_KEYS)[number]

function saleOrderBy(sort: SaleSortKey, dir: SortDir) {
  const primary: Record<SaleSortKey, Prisma.SaleOrderByWithRelationInput> = {
    date: { invoiceDate: dir },
    customer: { customer: { name: dir } },
    total: { totalAmount: dir },
    status: { status: dir },
  }
  return withTiebreak(primary[sort], dir)
}

async function requireAdmin() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")
  return session.user.id as string
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim()
}

function invoiceNumber() {
  return `INV-${Date.now().toString().slice(-8)}`
}

export async function getSaleSetup() {
  await requireAdmin()
  return Promise.all([
    prisma.customer.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, unit: { select: { symbol: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.godown.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])
}

export async function getSales(params: {
  status?: string
  query?: string
  page?: string
  sort?: string
  dir?: string
} = {}) {
  await requireAdmin()
  const status = params.status || "ALL"
  const query = params.query || ""
  const whereClause: Prisma.SaleWhereInput = {
    ...(status !== "ALL" ? { status } : {}),
    ...(query
      ? {
          OR: [
            { invoiceNo: { contains: query, mode: "insensitive" } },
            { customer: { name: { contains: query, mode: "insensitive" } } },
          ],
        }
      : {}),
  }

  const { sort, dir } = parseListQuery(params, {
    allowedSorts: SALE_SORT_KEYS,
    defaultSort: "date",
    defaultDir: "desc",
  })
  const orderBy = saleOrderBy(sort, dir)

  const result = await paginate(
    () => prisma.sale.count({ where: whereClause }),
    ({ skip, take }) =>
      prisma.sale.findMany({
        where: whereClause,
        include: { customer: true, godown: true, lines: true },
        orderBy,
        skip,
        take,
      }),
    Number(params.page) || 1,
  )

  return { ...result, sort, dir }
}

export async function getSale(id: string) {
  await requireAdmin()
  return prisma.sale.findUnique({
    where: { id },
    include: {
      customer: true,
      godown: true,
      lines: { include: { product: { include: { unit: true } } } },
      dispatches: true,
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

export async function createSale(formData: FormData) {
  const userId = await requireAdmin()
  const customerId = text(formData, "customerId")
  const godownId = text(formData, "godownId")
  const invoiceDate = new Date(text(formData, "invoiceDate"))
  const discount = Number(text(formData, "discount") || 0)
  const transportCost = Number(text(formData, "transportCost") || 0)
  const taxRate = Number(text(formData, "taxRate") || 0)
  const receivedAmount = Number(text(formData, "receivedAmount") || 0)
  const paymentType = text(formData, "paymentType") || "CREDIT"
  const paymentMethod = text(formData, "paymentMethod") || "CASH"
  const notes = text(formData, "notes") || null
  let lines: SaleLineInput[]
  try {
    lines = JSON.parse(text(formData, "lines")) as SaleLineInput[]
  } catch {
    throw new Error("Sale products are required")
  }

  if (!customerId || !godownId || Number.isNaN(invoiceDate.getTime()) || !lines.length)
    throw new Error("Customer, date, godown, and at least one product are required")
  if (
    ![discount, transportCost, receivedAmount].every(
      (amount) => Number.isFinite(amount) && amount >= 0,
    )
  )
    throw new Error("Amounts must be valid non-negative numbers")
  if (!ALLOWED_TAX_RATES.includes(taxRate as (typeof ALLOWED_TAX_RATES)[number]))
    throw new Error("Invalid tax rate")
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

  const [products, customer] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: lines.map((line) => line.productId) }, isActive: true },
    }),
    prisma.customer.findUnique({ where: { id: customerId }, select: { name: true } }),
  ])
  if (products.length !== new Set(lines.map((line) => line.productId)).size)
    throw new Error("One or more selected products are unavailable")
  if (!customer) throw new Error("Customer not found")
  for (const line of lines) {
    if ((await stockBalance(line.productId, godownId)) < line.quantity)
      throw new Error(
        `Insufficient stock for ${products.find((product) => product.id === line.productId)?.name || "product"}`,
      )
  }

  const itemsTotal = lines.reduce((sum, line) => sum + line.quantity * line.unitRate, 0)
  const preTaxTotal = Math.max(itemsTotal - discount + transportCost, 0)
  const taxAmount = Math.round(preTaxTotal * (taxRate / 100) * 100) / 100
  const totalAmount = preTaxTotal + taxAmount
  if (receivedAmount > totalAmount) throw new Error("Received amount cannot exceed the grand total")
  const status = receivedAmount === 0 ? "UNPAID" : receivedAmount < totalAmount ? "PARTIAL" : "PAID"
  const incomeTransactionNo = await generateIncomeTransactionNo()

  await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: {
        invoiceNo: invoiceNumber(),
        customerId,
        godownId,
        invoiceDate,
        status,
        totalAmount,
        receivedAmount,
        discount,
        transportCost,
        taxRate,
        taxAmount,
        paymentType,
        paymentMethod,
        notes,
        lines: {
          create: lines.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
            unitRate: line.unitRate,
            lineTotal: line.quantity * line.unitRate,
          })),
        },
      },
    })

    // The invoice total is recognized as income immediately, matching how the main Dashboard
    // already counts sales (by invoice total, not by what's been collected) — it does not
    // change later as payments come in against `receivedAmount`.
    if (totalAmount > 0) {
      await tx.income.create({
        data: {
          transactionNo: incomeTransactionNo,
          date: invoiceDate,
          source: `Sale ${sale.invoiceNo} - ${customer.name}`,
          description: `Invoice ${sale.invoiceNo} to ${customer.name}`,
          amount: totalAmount,
          paymentMethod,
          sourceType: FINANCE_SOURCE.SALE,
          sourceId: sale.id,
          createdById: userId,
        },
      })
    }

    // Revenue is split by product type (finished good vs. by-product/raw-material/packaging),
    // allocated proportionally to each group's share of itemsTotal so the split still sums
    // exactly to preTaxTotal even though discount/transportCost aren't tied to any one product.
    // Tax is collected on the customer's behalf, not revenue, so it's excluded here and posted
    // to Sales Tax Payable separately below.
    const itemsTotal = lines.reduce((sum, line) => sum + line.quantity * line.unitRate, 0)
    const revenueGroups = new Map<string, number>()
    for (const line of lines) {
      const product = products.find((item) => item.id === line.productId)!
      const code =
        product.type === "FINISHED_GOOD"
          ? LEDGER_ACCOUNTS.RICE_SALES.code
          : LEDGER_ACCOUNTS.BYPRODUCT_SALES.code
      revenueGroups.set(code, (revenueGroups.get(code) ?? 0) + line.quantity * line.unitRate)
    }
    const revenueEntries = [...revenueGroups.entries()]
    const revenueLines = revenueEntries.map(([code, groupItemsTotal], index) => {
      const amount =
        itemsTotal <= 0
          ? index === 0
            ? preTaxTotal
            : 0
          : index === revenueEntries.length - 1
            ? preTaxTotal -
              revenueEntries
                .slice(0, index)
                .reduce((sum, [, share]) => sum + (preTaxTotal * share) / itemsTotal, 0)
            : (preTaxTotal * groupItemsTotal) / itemsTotal
      return { accountCode: code, credit: amount }
    })

    let cogsTotal = 0
    for (const line of lines) {
      const avgCost = await getAverageUnitCost(tx, line.productId, godownId)
      cogsTotal += line.quantity * avgCost
    }

    await postJournalEntry(tx, {
      sourceType: LEDGER_SOURCE.SALE,
      sourceId: sale.id,
      date: invoiceDate,
      description: `Sale ${sale.invoiceNo} - ${customer.name}`,
      lines: [
        { accountCode: LEDGER_ACCOUNTS.AR.code, debit: totalAmount },
        ...revenueLines,
        ...(taxAmount > 0
          ? [{ accountCode: LEDGER_ACCOUNTS.SALES_TAX_PAYABLE.code, credit: taxAmount }]
          : []),
        ...(cogsTotal > 0
          ? [
              { accountCode: LEDGER_ACCOUNTS.COGS.code, debit: cogsTotal },
              { accountCode: LEDGER_ACCOUNTS.INVENTORY.code, credit: cogsTotal },
            ]
          : []),
      ],
    })
    if (receivedAmount > 0) {
      await postJournalEntry(tx, {
        sourceType: LEDGER_SOURCE.SALE_PAYMENT,
        sourceId: sale.id,
        date: invoiceDate,
        description: `Payment for Sale ${sale.invoiceNo}`,
        lines: [
          { accountCode: resolveCashOrBankAccount(paymentMethod), debit: receivedAmount },
          { accountCode: LEDGER_ACCOUNTS.AR.code, credit: receivedAmount },
        ],
      })
    }
  })

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/sales")
  revalidatePath("/dashboard/finance")
  revalidatePath("/dashboard/finance/income")
  redirect("/dashboard/sales")
}

export async function updateSalePayment(formData: FormData) {
  await requireAdmin()
  const id = text(formData, "id")
  const receivedAmount = Number(text(formData, "receivedAmount"))
  const paymentMethod = text(formData, "paymentMethod") || "CASH"
  const sale = await prisma.sale.findUnique({ where: { id } })
  if (
    !sale ||
    !Number.isFinite(receivedAmount) ||
    receivedAmount < 0 ||
    receivedAmount > Number(sale.totalAmount)
  )
    throw new Error("Invalid payment amount")
  const status =
    receivedAmount === 0 ? "UNPAID" : receivedAmount < Number(sale.totalAmount) ? "PARTIAL" : "PAID"
  await prisma.$transaction(async (tx) => {
    await tx.sale.update({ where: { id }, data: { receivedAmount, paymentMethod, status } })
    if (receivedAmount > 0) {
      await postJournalEntry(tx, {
        sourceType: LEDGER_SOURCE.SALE_PAYMENT,
        sourceId: id,
        date: sale.invoiceDate,
        description: `Payment for Sale ${sale.invoiceNo}`,
        lines: [
          { accountCode: resolveCashOrBankAccount(paymentMethod), debit: receivedAmount },
          { accountCode: LEDGER_ACCOUNTS.AR.code, credit: receivedAmount },
        ],
      })
    } else {
      await deleteJournalEntry(tx, LEDGER_SOURCE.SALE_PAYMENT, id)
    }
  })
  revalidatePath("/dashboard/sales")
  revalidatePath(`/dashboard/sales/${id}`)
  revalidatePath("/dashboard")
}
