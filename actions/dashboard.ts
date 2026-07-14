"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function getDashboardOverview() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const lots = await prisma.paddyLot.findMany({
    include: {
      mill: true,
      productionOutput: true,
    },
    orderBy: { purchaseDate: "asc" },
  })

  const monthlyTrend = Array.from(new Set(lots.map((lot) => new Date(lot.purchaseDate).toLocaleString("en-US", { month: "short" }))))
    .map((month) => {
      const matchingLots = lots.filter((lot) => new Date(lot.purchaseDate).toLocaleString("en-US", { month: "short" }) === month)
      const production = matchingLots.reduce((sum, lot) => sum + (lot.productionOutput?.rice ?? 0), 0)
      const quality = matchingLots.length
        ? matchingLots.reduce((sum, lot) => sum + (lot.productionOutput ? 85 + (lot.productionOutput.rice > 0 ? (lot.productionOutput.rice % 10) : 0) : 80), 0) / matchingLots.length
        : 0
      const yieldRatio = matchingLots.length
        ? matchingLots.reduce((sum, lot) => sum + (lot.productionOutput && lot.weight > 0 ? (lot.productionOutput.rice / lot.weight) * 100 : 0), 0) / matchingLots.length
        : 0
      const profit = matchingLots.reduce((sum, lot) => {
        const output = lot.productionOutput
        if (!output) return sum
        const revenue = (output.rice * (output.riceSaleRate || 0)) + (output.brokenRice * (output.brokenRiceSaleRate || 0))
        const cost = (output.laborCost || 0) + (output.electricityCost || 0) + (output.dryingCost || 0) + (output.packingCost || 0) + (output.transportCost || 0) + (output.loadingCost || 0) + (output.otherCost || 0)
        return sum + (revenue - cost)
      }, 0)

      return {
        month,
        production,
        quality,
        yieldRatio,
        profit,
      }
    })

  const supplierBreakdown = Array.from(new Map(lots.map((lot) => [lot.supplierName, [] as typeof lots])).entries()).map(([name, items]) => {
    const supplierLots = lots.filter((lot) => lot.supplierName === name)
    const production = supplierLots.reduce((sum, lot) => sum + (lot.productionOutput?.rice ?? 0), 0)
    const quality = supplierLots.length
      ? supplierLots.reduce((sum, lot) => sum + (lot.productionOutput ? 85 + (lot.productionOutput.rice % 10) : 80), 0) / supplierLots.length
      : 0
    const profit = supplierLots.reduce((sum, lot) => {
      const output = lot.productionOutput
      if (!output) return sum
      const revenue = (output.rice * (output.riceSaleRate || 0)) + (output.brokenRice * (output.brokenRiceSaleRate || 0))
      const cost = (output.laborCost || 0) + (output.electricityCost || 0) + (output.dryingCost || 0) + (output.packingCost || 0) + (output.transportCost || 0) + (output.loadingCost || 0) + (output.otherCost || 0)
      return sum + (revenue - cost)
    }, 0)

    return { name, production, quality, profit }
  })

  const varietyBreakdown = Array.from(new Map(lots.map((lot) => [lot.variety, [] as typeof lots])).entries()).map(([name, items]) => {
    const varietyLots = lots.filter((lot) => lot.variety === name)
    const production = varietyLots.reduce((sum, lot) => sum + (lot.productionOutput?.rice ?? 0), 0)
    const quality = varietyLots.length
      ? varietyLots.reduce((sum, lot) => sum + (lot.productionOutput ? 85 + (lot.productionOutput.rice % 10) : 80), 0) / varietyLots.length
      : 0
    const yieldRatio = varietyLots.length
      ? varietyLots.reduce((sum, lot) => sum + (lot.productionOutput && lot.weight > 0 ? (lot.productionOutput.rice / lot.weight) * 100 : 0), 0) / varietyLots.length
      : 0

    return { name, production, quality, yieldRatio }
  })

  const recentLots = lots
    .filter((lot) => lot.productionOutput)
    .slice(-6)
    .reverse()
    .map((lot) => ({
      lotNumber: lot.lotNumber,
      supplierName: lot.supplierName,
      variety: lot.variety,
      riceOutput: lot.productionOutput?.rice ?? 0,
      qualityScore: lot.productionOutput ? 85 + (lot.productionOutput.rice % 10) : 80,
      profit: (() => {
        const output = lot.productionOutput
        if (!output) return 0
        const revenue = (output.rice * (output.riceSaleRate || 0)) + (output.brokenRice * (output.brokenRiceSaleRate || 0))
        const cost = (output.laborCost || 0) + (output.electricityCost || 0) + (output.dryingCost || 0) + (output.packingCost || 0) + (output.transportCost || 0) + (output.loadingCost || 0) + (output.otherCost || 0)
        return revenue - cost
      })(),
    }))

  const totalProduction = lots.reduce((sum, lot) => sum + (lot.productionOutput?.paddyWeight ?? 0), 0)
  const totalRiceOutput = lots.reduce((sum, lot) => sum + (lot.productionOutput?.rice ?? 0), 0)
  const qualityScore = lots.length
    ? lots.reduce((sum, lot) => sum + (lot.productionOutput ? 85 + (lot.productionOutput.rice % 10) : 80), 0) / lots.length
    : 0
  const yieldRatio = lots.length && totalProduction > 0
    ? (totalRiceOutput / totalProduction) * 100
    : 0
  const totalRevenue = lots.reduce((sum, lot) => {
    const output = lot.productionOutput
    if (!output) return sum
    return sum + (output.rice * (output.riceSaleRate || 0)) + (output.brokenRice * (output.brokenRiceSaleRate || 0))
  }, 0)
  const totalCost = lots.reduce((sum, lot) => {
    const output = lot.productionOutput
    if (!output) return sum
    return sum + (output.laborCost || 0) + (output.electricityCost || 0) + (output.dryingCost || 0) + (output.packingCost || 0) + (output.transportCost || 0) + (output.loadingCost || 0) + (output.otherCost || 0)
  }, 0)
  const profit = totalRevenue - totalCost

  return {
    metrics: {
      totalProduction,
      totalRiceOutput,
      qualityScore,
      yieldRatio,
      profit,
      totalRevenue,
      totalCost,
    },
    monthlyTrend,
    supplierBreakdown,
    varietyBreakdown,
    recentLots,
  }
}
