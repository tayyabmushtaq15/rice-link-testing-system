"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { Prisma } from "@prisma/client"
import { paginate, parseListQuery, withTiebreak, type SortDir } from "@/lib/listQuery"

type DispatchLineInput = { saleLineId: string; quantity: number }

const DISPATCH_SORT_KEYS = ["date", "status"] as const
type DispatchSortKey = (typeof DISPATCH_SORT_KEYS)[number]

function dispatchOrderBy(sort: DispatchSortKey, dir: SortDir) {
  const primary: Record<DispatchSortKey, Prisma.DispatchOrderByWithRelationInput> = {
    date: { dispatchDate: dir },
    status: { status: dir },
  }
  return withTiebreak(primary[sort], dir)
}
const statuses = ["PENDING", "LOADING", "DISPATCHED", "DELIVERED", "CANCELLED"] as const
// Statuses at or beyond this point in the workflow have already posted stock-out movements
// and incremented dispatchedQty on the invoice lines; cancelling from here on would silently
// leave stock and invoice fulfillment out of sync, so it is blocked (see updateDispatchStatus).
const postedStatuses = new Set(["DISPATCHED", "DELIVERED"])

async function requireAdmin() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")
  return session.user.id as string
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim()
}

async function stockCostBasis(tx: Prisma.TransactionClient, productId: string, godownId: string) {
  const movements = await tx.stockMovement.findMany({
    where: { productId, godownId },
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
  return { balance, avgCost: balance > 0 ? value / balance : 0 }
}

async function postDispatch(tx: Prisma.TransactionClient, dispatchId: string) {
  const dispatch = await tx.dispatch.findUnique({
    where: { id: dispatchId },
    include: { lines: true },
  })
  if (!dispatch) throw new Error("Dispatch not found")
  const alreadyPosted = await tx.stockMovement.findFirst({
    where: { sourceType: "DISPATCH", sourceId: dispatch.id },
  })
  if (alreadyPosted) return
  const costBasis = new Map<string, number>()
  for (const line of dispatch.lines) {
    const { balance, avgCost } = await stockCostBasis(tx, line.productId, dispatch.godownId)
    if (balance < Number(line.quantity)) throw new Error("Dispatch would create negative stock")
    costBasis.set(line.productId, avgCost)
  }
  await tx.stockMovement.createMany({
    data: dispatch.lines.map((line) => ({
      productId: line.productId,
      godownId: dispatch.godownId,
      quantityIn: 0,
      quantityOut: line.quantity,
      unitCost: costBasis.get(line.productId) ?? 0,
      sourceType: "DISPATCH",
      sourceId: dispatch.id,
      occurredAt: dispatch.dispatchDate,
    })),
  })
  for (const line of dispatch.lines) {
    if (line.saleLineId)
      await tx.saleLine.update({
        where: { id: line.saleLineId },
        data: { dispatchedQty: { increment: line.quantity } },
      })
  }
}

async function recordStatusHistory(
  tx: Prisma.TransactionClient,
  dispatchId: string,
  fromStatus: string | null,
  toStatus: string,
  changedById: string,
  notes?: string,
) {
  await tx.dispatchStatusHistory.create({
    data: { dispatchId, fromStatus, toStatus, changedById, notes },
  })
}

export async function getDispatchSetup() {
  await requireAdmin()
  const [sales, godowns] = await Promise.all([
    prisma.sale.findMany({
      where: { lines: { some: { quantity: { gt: 0 } } } },
      select: {
        id: true,
        invoiceNo: true,
        customer: { select: { name: true } },
        lines: {
          select: {
            id: true,
            productId: true,
            quantity: true,
            dispatchedQty: true,
            product: { select: { name: true, unit: { select: { symbol: true } } } },
          },
        },
      },
      orderBy: { invoiceDate: "desc" },
    }),
    prisma.godown.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])
  return [
    sales.map((sale) => ({
      ...sale,
      lines: sale.lines.map((line) => ({
        ...line,
        quantity: Number(line.quantity),
        dispatchedQty: Number(line.dispatchedQty),
      })),
    })),
    godowns,
  ] as const
}

export async function getDispatches(params: {
  status?: string
  page?: string
  sort?: string
  dir?: string
} = {}) {
  await requireAdmin()
  const status = params.status || "ALL"
  const whereClause = status !== "ALL" ? { status } : undefined

  const { sort, dir } = parseListQuery(params, {
    allowedSorts: DISPATCH_SORT_KEYS,
    defaultSort: "date",
    defaultDir: "desc",
  })
  const orderBy = dispatchOrderBy(sort, dir)

  const result = await paginate(
    () => prisma.dispatch.count({ where: whereClause }),
    ({ skip, take }) =>
      prisma.dispatch.findMany({
        where: whereClause,
        include: {
          sale: { include: { customer: true } },
          godown: true,
          lines: { include: { product: { include: { unit: true } } } },
        },
        orderBy,
        skip,
        take,
      }),
    Number(params.page) || 1,
  )

  return { ...result, sort, dir }
}

export async function getDispatch(id: string) {
  await requireAdmin()
  return prisma.dispatch.findUnique({
    where: { id },
    include: {
      sale: { include: { customer: true } },
      godown: true,
      lines: { include: { product: { include: { unit: true } } } },
      statusHistory: {
        orderBy: { changedAt: "desc" },
        include: { changedBy: { select: { name: true, email: true } } },
      },
    },
  })
}

export async function createDispatch(formData: FormData) {
  const userId = await requireAdmin()
  const saleId = text(formData, "saleId")
  const godownId = text(formData, "godownId")
  const dispatchDate = new Date(text(formData, "dispatchDate"))
  const status = text(formData, "status") || "PENDING"
  const vehicleNo = text(formData, "vehicleNo") || null
  const driverName = text(formData, "driverName") || null
  const deliveryNotes = text(formData, "deliveryNotes") || null
  let lines: DispatchLineInput[]
  try {
    lines = JSON.parse(text(formData, "lines")) as DispatchLineInput[]
  } catch {
    throw new Error("Dispatch lines are required")
  }
  if (
    !saleId ||
    !godownId ||
    Number.isNaN(dispatchDate.getTime()) ||
    !statuses.includes(status as (typeof statuses)[number]) ||
    !lines.length
  )
    throw new Error("Sale, date, godown, status, and lines are required")
  const sale = await prisma.sale.findUnique({ where: { id: saleId }, include: { lines: true } })
  if (!sale) throw new Error("Sale not found")
  const saleLines = new Map(sale.lines.map((line) => [line.id, line]))
  for (const line of lines) {
    const saleLine = saleLines.get(line.saleLineId)
    if (
      !saleLine ||
      !Number.isFinite(line.quantity) ||
      line.quantity <= 0 ||
      line.quantity > Number(saleLine.quantity) - Number(saleLine.dispatchedQty)
    )
      throw new Error("Dispatch quantity exceeds the remaining invoice quantity")
  }

  await prisma.$transaction(async (tx) => {
    const dispatch = await tx.dispatch.create({
      data: {
        dispatchNo: `DSP-${Date.now().toString().slice(-8)}`,
        saleId,
        godownId,
        dispatchDate,
        status,
        vehicleNo,
        driverName,
        deliveryNotes,
        lines: {
          create: lines.map((line) => ({
            saleLineId: line.saleLineId,
            productId: saleLines.get(line.saleLineId)!.productId,
            quantity: line.quantity,
          })),
        },
      },
    })
    if (status === "DISPATCHED" || status === "DELIVERED") await postDispatch(tx, dispatch.id)
    await recordStatusHistory(tx, dispatch.id, null, status, userId, "Dispatch created")
  })
  revalidatePath("/dashboard/dispatch")
  revalidatePath("/dashboard/sales")
  revalidatePath("/dashboard/stock")
  revalidatePath("/dashboard")
  redirect("/dashboard/dispatch")
}

export async function updateDispatchStatus(id: string, status: string) {
  const userId = await requireAdmin()
  if (!statuses.includes(status as (typeof statuses)[number]))
    throw new Error("Invalid dispatch status")
  await prisma.$transaction(async (tx) => {
    const dispatch = await tx.dispatch.findUnique({ where: { id } })
    if (!dispatch) throw new Error("Dispatch not found")
    if (dispatch.status === "CANCELLED" || dispatch.status === "DELIVERED")
      throw new Error("This dispatch can no longer change status")
    if (status === "CANCELLED" && postedStatuses.has(dispatch.status))
      throw new Error(
        "Stock has already been posted for this dispatch; it can no longer be cancelled directly. Reverse it with a stock adjustment/return instead.",
      )
    if (status === "CANCELLED") {
      await tx.dispatch.update({ where: { id }, data: { status } })
      await recordStatusHistory(tx, id, dispatch.status, status, userId)
      return
    }
    if (status === "DISPATCHED" || status === "DELIVERED") await postDispatch(tx, id)
    await tx.dispatch.update({
      where: { id },
      data: { status, deliveredAt: status === "DELIVERED" ? new Date() : undefined },
    })
    await recordStatusHistory(tx, id, dispatch.status, status, userId)
  })
  revalidatePath("/dashboard/dispatch")
  revalidatePath(`/dashboard/dispatch/${id}`)
  revalidatePath("/dashboard/sales")
  revalidatePath("/dashboard/stock")
  revalidatePath("/dashboard")
}
