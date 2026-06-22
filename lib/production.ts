import { z } from "zod"

export const productionOutputSchema = z.object({
  paddyWeight: z.number().min(0.1, "Paddy weight must be greater than 0"),
  rice: z.number().min(0, "Rice cannot be negative"),
  brokenRice: z.number().min(0, "Broken Rice cannot be negative"),
  husk: z.number().min(0, "Husk cannot be negative"),
  polish: z.number().min(0, "Polish cannot be negative"),
  waste: z.number().min(0, "Waste cannot be negative"),
  shortage: z.number().min(0, "Shortage cannot be negative"),
  laborCost: z.number().min(0, "Labor cost cannot be negative"),
  electricityCost: z.number().min(0, "Electricity cost cannot be negative"),
  dryingCost: z.number().min(0, "Drying cost cannot be negative"),
  packingCost: z.number().min(0, "Packing cost cannot be negative"),
  transportCost: z.number().min(0, "Transport cost cannot be negative"),
  loadingCost: z.number().min(0, "Loading cost cannot be negative"),
  otherCost: z.number().min(0, "Other cost cannot be negative"),
  riceSaleRate: z.number().min(0, "Rice sale rate cannot be negative"),
  brokenRiceSaleRate: z.number().min(0, "Broken sale rate cannot be negative"),
  huskSaleRate: z.number().min(0, "Husk sale rate cannot be negative"),
  polishSaleRate: z.number().min(0, "Polish sale rate cannot be negative"),
})

export type ProductionOutputFormValues = z.infer<typeof productionOutputSchema>

export type ProductionSummary = {
  paddyCost: number
  processingCost: number
  totalLotCost: number
  saleableOutput: number
  totalOutput: number
  totalLoss: number
  balanceDifference: number
  totalRecoveryPercent: number
  riceRecoveryPercent: number
  brokenPercent: number
  huskPercent: number
  polishPercent: number
  wastePercent: number
  shortagePercent: number
  costPerPaddyKg: number
  costPerSaleableKg: number
  costPerRiceKg: number
  expectedSaleValue: number
  grossProfit: number
  profitMarginPercent: number
}

function roundPercent(value: number) {
  return Number(value.toFixed(2))
}

export function calculateProductionSummary(
  output: ProductionOutputFormValues,
  purchaseRate = 0
): ProductionSummary {
  const saleableOutput = output.rice + output.brokenRice + output.husk + output.polish
  const totalOutput = saleableOutput + output.waste + output.shortage
  const baseWeight = output.paddyWeight || 1
  const paddyCost = output.paddyWeight * purchaseRate
  const processingCost =
    output.laborCost +
    output.electricityCost +
    output.dryingCost +
    output.packingCost +
    output.transportCost +
    output.loadingCost +
    output.otherCost
  const totalLotCost = paddyCost + processingCost
  const expectedSaleValue =
    output.rice * output.riceSaleRate +
    output.brokenRice * output.brokenRiceSaleRate +
    output.husk * output.huskSaleRate +
    output.polish * output.polishSaleRate
  const grossProfit = expectedSaleValue - totalLotCost

  return {
    paddyCost,
    processingCost,
    totalLotCost,
    saleableOutput,
    totalOutput,
    totalLoss: output.waste + output.shortage,
    balanceDifference: baseWeight - totalOutput,
    totalRecoveryPercent: roundPercent((saleableOutput / baseWeight) * 100),
    riceRecoveryPercent: roundPercent((output.rice / baseWeight) * 100),
    brokenPercent: roundPercent((output.brokenRice / baseWeight) * 100),
    huskPercent: roundPercent((output.husk / baseWeight) * 100),
    polishPercent: roundPercent((output.polish / baseWeight) * 100),
    wastePercent: roundPercent((output.waste / baseWeight) * 100),
    shortagePercent: roundPercent((output.shortage / baseWeight) * 100),
    costPerPaddyKg: roundPercent(totalLotCost / baseWeight),
    costPerSaleableKg: saleableOutput > 0 ? roundPercent(totalLotCost / saleableOutput) : 0,
    costPerRiceKg: output.rice > 0 ? roundPercent(totalLotCost / output.rice) : 0,
    expectedSaleValue,
    grossProfit,
    profitMarginPercent: expectedSaleValue > 0 ? roundPercent((grossProfit / expectedSaleValue) * 100) : 0,
  }
}
