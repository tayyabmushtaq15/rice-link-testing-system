import type { ProductionPdfData } from "@/components/production/ProductionPdfDocument"
import { calculateProductionSummary, type ProductionOutputFormValues } from "@/lib/production"

type ProductionPdfSource = {
  id: string
  lotNumber: string
  supplierName: string
  variety: string
  purchaseDate: Date
  purchaseRate: number
  mill: {
    name: string
  }
  productionOutput: ProductionOutputFormValues
}

function formatKg(value: number) {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} KG`
}

function formatMoney(value: number) {
  return `PKR ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}

function formatPercent(value: number) {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`
}

function formatReportNumber(id: string) {
  return `PROD-${id.slice(0, 8).toUpperCase()}`
}

export function buildProductionPdfData(lot: ProductionPdfSource): ProductionPdfData {
  const output = lot.productionOutput
  const summary = calculateProductionSummary(output, lot.purchaseRate)

  return {
    reportNumber: formatReportNumber(lot.id),
    lotNumber: lot.lotNumber,
    partyName: lot.supplierName,
    variety: lot.variety,
    millName: lot.mill.name,
    purchaseDate: lot.purchaseDate.toLocaleDateString(),
    paddyWeight: formatKg(output.paddyWeight),
    purchaseRate: formatMoney(lot.purchaseRate),
    paddyCost: formatMoney(summary.paddyCost),
    outputRows: [
      { label: "Rice", weight: formatKg(output.rice), percent: formatPercent(summary.riceRecoveryPercent) },
      { label: "Broken Rice", weight: formatKg(output.brokenRice), percent: formatPercent(summary.brokenPercent) },
      { label: "Husk", weight: formatKg(output.husk), percent: formatPercent(summary.huskPercent) },
      { label: "Polish / Bran", weight: formatKg(output.polish), percent: formatPercent(summary.polishPercent) },
      { label: "Waste", weight: formatKg(output.waste), percent: formatPercent(summary.wastePercent) },
      { label: "Shortage / Moisture Loss", weight: formatKg(output.shortage), percent: formatPercent(summary.shortagePercent) },
    ],
    costRows: [
      { label: "Paddy Cost", amount: formatMoney(summary.paddyCost) },
      { label: "Labor Cost", amount: formatMoney(output.laborCost) },
      { label: "Electricity Cost", amount: formatMoney(output.electricityCost) },
      { label: "Drying Cost", amount: formatMoney(output.dryingCost) },
      { label: "Packing Cost", amount: formatMoney(output.packingCost) },
      { label: "Transport Cost", amount: formatMoney(output.transportCost) },
      { label: "Loading / Unloading", amount: formatMoney(output.loadingCost) },
      { label: "Other Cost", amount: formatMoney(output.otherCost) },
      { label: "Total Processing Cost", amount: formatMoney(summary.processingCost) },
      { label: "Total Lot Cost", amount: formatMoney(summary.totalLotCost) },
    ],
    saleRows: [
      {
        label: "Rice",
        weight: formatKg(output.rice),
        rate: formatMoney(output.riceSaleRate),
        value: formatMoney(output.rice * output.riceSaleRate),
      },
      {
        label: "Broken Rice",
        weight: formatKg(output.brokenRice),
        rate: formatMoney(output.brokenRiceSaleRate),
        value: formatMoney(output.brokenRice * output.brokenRiceSaleRate),
      },
      {
        label: "Husk",
        weight: formatKg(output.husk),
        rate: formatMoney(output.huskSaleRate),
        value: formatMoney(output.husk * output.huskSaleRate),
      },
      {
        label: "Polish / Bran",
        weight: formatKg(output.polish),
        rate: formatMoney(output.polishSaleRate),
        value: formatMoney(output.polish * output.polishSaleRate),
      },
    ],
    summaryRows: [
      { label: "Total Output", value: formatKg(summary.totalOutput) },
      { label: "Saleable Output", value: formatKg(summary.saleableOutput) },
      { label: "Total Recovery", value: formatPercent(summary.totalRecoveryPercent) },
      { label: "Weight Balance Difference", value: formatKg(summary.balanceDifference) },
      { label: "Average Cost / Paddy KG", value: formatMoney(summary.costPerPaddyKg) },
      { label: "Average Cost / Saleable KG", value: formatMoney(summary.costPerSaleableKg) },
      { label: "Average Cost / Rice KG", value: formatMoney(summary.costPerRiceKg) },
      { label: "Expected Sale Value", value: formatMoney(summary.expectedSaleValue) },
      { label: "Gross Profit / Loss", value: formatMoney(summary.grossProfit) },
      { label: "Profit Margin", value: formatPercent(summary.profitMarginPercent) },
    ],
  }
}
