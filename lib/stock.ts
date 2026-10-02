import type { Prisma } from "@prisma/client"

type StockMovementLike = {
  productId: string
  quantityIn: unknown
  quantityOut: unknown
  unitCost: unknown
  product: { name: string; unit: { symbol: string } }
}

export type ProductStockBalance = {
  productId: string
  name: string
  unit: string
  quantity: number
  value: number
}

/**
 * Net quantity and cost-basis value per product from the full stock movement
 * history. Outgoing movements reduce value using their own unit cost (a
 * simplified running-cost model, not true weighted-average), matching the
 * calculation used on the Stock page so figures stay consistent app-wide.
 */
export function calculateProductStockBalances(
  movements: StockMovementLike[],
): ProductStockBalance[] {
  const balances = new Map<string, ProductStockBalance>()

  for (const movement of movements) {
    const quantityIn = Number(movement.quantityIn)
    const quantityOut = Number(movement.quantityOut)
    const unitCost = movement.unitCost ? Number(movement.unitCost) : 0

    const entry = balances.get(movement.productId) || {
      productId: movement.productId,
      name: movement.product.name,
      unit: movement.product.unit.symbol,
      quantity: 0,
      value: 0,
    }

    entry.quantity += quantityIn - quantityOut
    if (quantityIn > 0) entry.value += quantityIn * unitCost
    if (quantityOut > 0) entry.value -= Math.min(entry.value, quantityOut * unitCost)

    balances.set(movement.productId, entry)
  }

  return [...balances.values()]
}

/**
 * Same running-cost formula as calculateProductStockBalances above, scoped to a single product
 * and queried fresh from a transaction — used to price outflows (Sale COGS, Dispatch) against
 * whatever StockMovement history already exists at posting time.
 */
export async function getAverageUnitCost(
  tx: Prisma.TransactionClient,
  productId: string,
  godownId: string,
): Promise<number> {
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
  return balance > 0 ? value / balance : 0
}
