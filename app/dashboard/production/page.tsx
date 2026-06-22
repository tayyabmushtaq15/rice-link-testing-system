import Link from "next/link"
import { BarChart3, Eye, Factory } from "lucide-react"

import { getProductionLots } from "@/actions/production"
import { ProductionPdfActions } from "@/components/production/ProductionPdfActions"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { calculateProductionSummary } from "@/lib/production"
import { buildProductionPdfData } from "@/lib/productionPdf"

function formatPercent(value: number) {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`
}

function formatKg(value: number) {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} KG`
}

function formatMoney(value: number) {
  return `PKR ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}

function SummaryCard({
  title,
  value,
  detail,
}: {
  title: string
  value: string
  detail: string
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{detail}</p>
      </CardContent>
    </Card>
  )
}

export default async function ProductionPage() {
  const lots = await getProductionLots()
  const completedLots = lots.filter((lot) => lot.productionOutput)

  const totals = completedLots.reduce(
    (acc, lot) => {
      const output = lot.productionOutput
      if (!output) return acc
      const summary = calculateProductionSummary(output, lot.purchaseRate)

      acc.paddyWeight += output.paddyWeight
      acc.rice += output.rice
      acc.brokenRice += output.brokenRice
      acc.husk += output.husk
      acc.polish += output.polish
      acc.waste += output.waste
      acc.shortage += output.shortage
      acc.saleableOutput += summary.saleableOutput
      acc.totalOutput += summary.totalOutput
      acc.totalLotCost += summary.totalLotCost
      acc.expectedSaleValue += summary.expectedSaleValue
      acc.grossProfit += summary.grossProfit
      return acc
    },
    {
      paddyWeight: 0,
      rice: 0,
      brokenRice: 0,
      husk: 0,
      polish: 0,
      waste: 0,
      shortage: 0,
      saleableOutput: 0,
      totalOutput: 0,
      totalLotCost: 0,
      expectedSaleValue: 0,
      grossProfit: 0,
    }
  )
  const totalRecoveryPercent =
    totals.paddyWeight > 0 ? (totals.saleableOutput / totals.paddyWeight) * 100 : 0
  const averageCost =
    totals.saleableOutput > 0 ? totals.totalLotCost / totals.saleableOutput : 0
  const profitMargin =
    totals.expectedSaleValue > 0 ? (totals.grossProfit / totals.expectedSaleValue) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Production Output</h1>
          <p className="text-muted-foreground mt-1">Paddy lot output and recovery summary</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <SummaryCard
          title="Lots With Output"
          value={completedLots.length.toString()}
          detail={`${lots.length} paddy lots tracked`}
        />
        <SummaryCard
          title="Total Recovery"
          value={formatPercent(totalRecoveryPercent)}
          detail={formatKg(totals.saleableOutput)}
        />
        <SummaryCard
          title="Total Output"
          value={formatKg(totals.totalOutput)}
          detail={`${formatKg(totals.paddyWeight)} paddy input`}
        />
        <SummaryCard
          title="Average Cost"
          value={formatMoney(averageCost)}
          detail="Per saleable output KG"
        />
        <SummaryCard
          title="Expected Profit"
          value={formatMoney(totals.grossProfit)}
          detail={`${formatPercent(profitMargin)} margin`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Factory className="h-5 w-5 text-emerald-600" />
            Paddy Lot Outputs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lot Number</TableHead>
                <TableHead>Mill</TableHead>
                <TableHead>Variety</TableHead>
                <TableHead>Paddy Weight</TableHead>
                <TableHead>Total Output</TableHead>
                <TableHead>Rice</TableHead>
                <TableHead>Total Recovery</TableHead>
                <TableHead>Avg Cost</TableHead>
                <TableHead>Profit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lots.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                    No paddy lots found.
                  </TableCell>
                </TableRow>
              ) : (
                lots.map((lot) => {
                  const output = lot.productionOutput
                  const lotSummary = output ? calculateProductionSummary(output, lot.purchaseRate) : null
                  const productionPdf = output
                    ? buildProductionPdfData({
                        ...lot,
                        productionOutput: output,
                      })
                    : null

                  return (
                    <TableRow key={lot.id}>
                      <TableCell className="font-medium text-emerald-700">
                        <Link href={`/dashboard/lots/${lot.id}`} className="hover:underline">
                          {lot.lotNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{lot.mill.name}</TableCell>
                      <TableCell>{lot.variety}</TableCell>
                      <TableCell>{formatKg(output?.paddyWeight ?? lot.weight)}</TableCell>
                      <TableCell>{lotSummary ? formatKg(lotSummary.totalOutput) : "-"}</TableCell>
                      <TableCell>{output ? formatKg(output.rice) : "-"}</TableCell>
                      <TableCell>
                        {lotSummary ? formatPercent(lotSummary.totalRecoveryPercent) : "-"}
                      </TableCell>
                      <TableCell>
                        {lotSummary ? formatMoney(lotSummary.costPerSaleableKg) : "-"}
                      </TableCell>
                      <TableCell>
                        {lotSummary ? formatMoney(lotSummary.grossProfit) : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            output
                              ? "bg-emerald-100 text-emerald-800 border-none"
                              : "bg-slate-100 text-slate-800 border-none"
                          }
                        >
                          {output ? "RECORDED" : "PENDING"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {productionPdf && <ProductionPdfActions report={productionPdf} compact />}
                          <Link
                            href={`/dashboard/lots/${lot.id}`}
                            className={buttonVariants({ variant: "ghost", size: "icon" })}
                          >
                            {output ? <Eye className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
