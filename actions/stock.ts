"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { randomUUID } from "crypto"
import type { Prisma } from "@prisma/client"
import { calculateProductStockBalances } from "@/lib/stock"
import { paginate, parseListQuery, withTiebreak, type SortDir } from "@/lib/listQuery"

const STOCK_MOVEMENT_SORT_KEYS = ["date", "product", "godown"] as const
type StockMovementSortKey = (typeof STOCK_MOVEMENT_SORT_KEYS)[number]

// StockMovement rows are routinely created in batches within one transaction (e.g. all the lines
// of a purchase, or a production batch's inputs+outputs), where Postgres's now() is fixed for the
// whole transaction — so a createdAt column wouldn't distinguish them. `seq` (an autoincrement
// column) is monotonic even across batched inserts, so it's used as the tiebreaker instead of the
// default createdAt/id chain.
function stockMovementOrderBy(sort: StockMovementSortKey, dir: SortDir) {
  const primary: Record<StockMovementSortKey, Prisma.StockMovementOrderByWithRelationInput> = {
    date: { occurredAt: dir },
    product: { product: { name: dir } },
    godown: { godown: { name: dir } },
  }
  return withTiebreak(primary[sort], dir, [{ seq: dir }])
}

async function requireAdmin() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim()
}

async function currentBalance(productId: string, godownId: string, tx: Prisma.TransactionClient) {
  const movements = await tx.stockMovement.findMany({
    where: { productId, godownId },
    select: { quantityIn: true, quantityOut: true },
  })
  return movements.reduce(
    (total, movement) => total + Number(movement.quantityIn) - Number(movement.quantityOut),
    0,
  )
}

export async function getStockOperationSetup() {
  await requireAdmin()
  return Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      include: { unit: true },
      orderBy: { name: "asc" },
    }),
    prisma.godown.findMany({
      where: { isActive: true },
      include: { unit: true },
      orderBy: { name: "asc" },
    }),
  ])
}

export async function createStockAdjustment(formData: FormData) {
  await requireAdmin()
  const productId = text(formData, "productId")
  const godownId = text(formData, "godownId")
  const direction = text(formData, "direction")
  const reason = text(formData, "reason")
  const quantity = Number(text(formData, "quantity"))
  const unitCost = Number(text(formData, "unitCost") || 0)
  if (
    !productId ||
    !godownId ||
    !reason ||
    !["IN", "OUT"].includes(direction) ||
    !Number.isFinite(quantity) ||
    quantity <= 0 ||
    !Number.isFinite(unitCost) ||
    unitCost < 0
  )
    throw new Error("Valid product, godown, quantity, cost, direction, and reason are required")

  await prisma.$transaction(async (tx) => {
    if (direction === "OUT" && (await currentBalance(productId, godownId, tx)) < quantity)
      throw new Error("Adjustment would create negative stock")
    await tx.stockMovement.create({
      data: {
        productId,
        godownId,
        quantityIn: direction === "IN" ? quantity : 0,
        quantityOut: direction === "OUT" ? quantity : 0,
        unitCost,
        sourceType: "ADJUSTMENT",
        sourceId: `${randomUUID()}:${reason}`,
        occurredAt: new Date(),
      },
    })
  })
  revalidatePath("/dashboard/stock")
  revalidatePath("/dashboard")
}

export async function transferStock(formData: FormData) {
  await requireAdmin()
  const productId = text(formData, "productId")
  const fromGodownId = text(formData, "fromGodownId")
  const toGodownId = text(formData, "toGodownId")
  const reason = text(formData, "reason")
  const quantity = Number(text(formData, "quantity"))
  if (
    !productId ||
    !fromGodownId ||
    !toGodownId ||
    fromGodownId === toGodownId ||
    !reason ||
    !Number.isFinite(quantity) ||
    quantity <= 0
  )
    throw new Error("Valid different godowns, quantity, and reason are required")

  await prisma.$transaction(async (tx) => {
    if ((await currentBalance(productId, fromGodownId, tx)) < quantity)
      throw new Error("Transfer would create negative stock")
    const transferId = randomUUID()
    await tx.stockMovement.createMany({
      data: [
        {
          productId,
          godownId: fromGodownId,
          quantityIn: 0,
          quantityOut: quantity,
          sourceType: "TRANSFER_OUT",
          sourceId: `${transferId}:${reason}`,
          occurredAt: new Date(),
        },
        {
          productId,
          godownId: toGodownId,
          quantityIn: quantity,
          quantityOut: 0,
          sourceType: "TRANSFER_IN",
          sourceId: `${transferId}:${reason}`,
          occurredAt: new Date(),
        },
      ],
    })
  })
  revalidatePath("/dashboard/stock")
  revalidatePath("/dashboard")
}

export async function getStockSummary(filters?: {
  productId?: string
  godownId?: string
  page?: string
  sort?: string
  dir?: string
}) {
  await requireAdmin()

  const movementWhere: Prisma.StockMovementWhereInput = {
    ...(filters?.productId && filters.productId !== "all"
      ? { productId: filters.productId }
      : {}),
    ...(filters?.godownId && filters.godownId !== "all" ? { godownId: filters.godownId } : {}),
  }

  const { sort, dir } = parseListQuery(filters ?? {}, {
    allowedSorts: STOCK_MOVEMENT_SORT_KEYS,
    defaultSort: "date",
    defaultDir: "desc",
  })
  const orderBy = stockMovementOrderBy(sort, dir)

  const movementsResult = await paginate(
    () => prisma.stockMovement.count({ where: movementWhere }),
    ({ skip, take }) =>
      prisma.stockMovement.findMany({
        where: movementWhere,
        include: {
          product: { include: { unit: true } },
          godown: { include: { unit: true } },
        },
        orderBy,
        skip,
        take,
      }),
    Number(filters?.page) || 1,
  )

  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { unit: true },
    orderBy: { name: "asc" },
  })
  const godowns = await prisma.godown.findMany({
    where: { isActive: true },
    include: { unit: true },
    orderBy: { name: "asc" },
  })
  const godownMap = new Map<
    string,
    { godownId: string; godownName: string; symbol: string; quantity: number; capacity: number }
  >()

  const allMovements = await prisma.stockMovement.findMany({
    include: { product: { include: { unit: true } }, godown: { include: { unit: true } } },
  })
  for (const movement of allMovements) {
    const netQuantity = Number(movement.quantityIn) - Number(movement.quantityOut)
    const godownEntry = godownMap.get(movement.godownId) || {
      godownId: movement.godownId,
      godownName: movement.godown.name,
      symbol: movement.godown.unit.symbol,
      quantity: 0,
      capacity: Number(movement.godown.capacity),
    }
    godownEntry.quantity += netQuantity
    godownMap.set(movement.godownId, godownEntry)
  }

  const productBalances = calculateProductStockBalances(allMovements).map((entry) => ({
    productId: entry.productId,
    productName: entry.name,
    symbol: entry.unit,
    quantity: entry.quantity,
    value: entry.value,
  }))

  return {
    products,
    godowns,
    movements: movementsResult.items,
    movementsTotal: movementsResult.total,
    movementsPage: movementsResult.page,
    movementsPageSize: movementsResult.pageSize,
    movementsTotalPages: movementsResult.totalPages,
    sort,
    dir,
    balances: productBalances.filter(
      (entry) =>
        !filters?.productId || filters.productId === "all" || entry.productId === filters.productId,
    ),
    godownBalances: [...godownMap.values()].filter(
      (entry) =>
        !filters?.godownId || filters.godownId === "all" || entry.godownId === filters.godownId,
    ),
  }
}
