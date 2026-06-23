"use client"

import { useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useForm, type Resolver } from "react-hook-form"
import { BarChart3, Banknote, PackageCheck, Recycle, Save, Trash2 } from "lucide-react"
import { z } from "zod"

import { upsertProductionOutput } from "@/actions/production"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  calculateProductionSummary,
  productionOutputSchema,
  type ProductionOutputFormValues,
} from "@/lib/production"

type ProductionOutputInitialData = {
  paddyWeight: number
  rice: number
  brokenRice: number
  husk: number
  polish: number
  waste: number
  shortage: number
  laborCost: number
  electricityCost: number
  dryingCost: number
  packingCost: number
  transportCost: number
  loadingCost: number
  otherCost: number
  riceSaleRate: number
  brokenRiceSaleRate: number
  huskSaleRate: number
  polishSaleRate: number
} | null

type ProductionOutputFormProps = {
  paddyLotId: string
  lotWeight: number
  purchaseRate: number
  initialData?: ProductionOutputInitialData
}

const formSchema = productionOutputSchema.extend({
  paddyWeight: z.coerce.number().min(0.1, "Paddy weight must be greater than 0"),
  rice: z.coerce.number().min(0, "Rice cannot be negative"),
  brokenRice: z.coerce.number().min(0, "Broken Rice cannot be negative"),
  husk: z.coerce.number().min(0, "Husk cannot be negative"),
  polish: z.coerce.number().min(0, "Polish cannot be negative"),
  waste: z.coerce.number().min(0, "Waste cannot be negative"),
  shortage: z.coerce.number().min(0, "Shortage cannot be negative"),
  laborCost: z.coerce.number().min(0, "Labor cost cannot be negative"),
  electricityCost: z.coerce.number().min(0, "Electricity cost cannot be negative"),
  dryingCost: z.coerce.number().min(0, "Drying cost cannot be negative"),
  packingCost: z.coerce.number().min(0, "Packing cost cannot be negative"),
  transportCost: z.coerce.number().min(0, "Transport cost cannot be negative"),
  loadingCost: z.coerce.number().min(0, "Loading cost cannot be negative"),
  otherCost: z.coerce.number().min(0, "Other cost cannot be negative"),
  riceSaleRate: z.coerce.number().min(0, "Rice sale rate cannot be negative"),
  brokenRiceSaleRate: z.coerce.number().min(0, "Broken sale rate cannot be negative"),
  huskSaleRate: z.coerce.number().min(0, "Husk sale rate cannot be negative"),
  polishSaleRate: z.coerce.number().min(0, "Polish sale rate cannot be negative"),
})

type ProductionOutputFormInput = Omit<z.input<typeof formSchema>,
  | "paddyWeight"
  | "rice"
  | "brokenRice"
  | "husk"
  | "polish"
  | "waste"
  | "shortage"
  | "laborCost"
  | "electricityCost"
  | "dryingCost"
  | "packingCost"
  | "transportCost"
  | "loadingCost"
  | "otherCost"
  | "riceSaleRate"
  | "brokenRiceSaleRate"
  | "huskSaleRate"
  | "polishSaleRate"
> & {
  paddyWeight: number
  rice: number
  brokenRice: number
  husk: number
  polish: number
  waste: number
  shortage: number
  laborCost: number
  electricityCost: number
  dryingCost: number
  packingCost: number
  transportCost: number
  loadingCost: number
  otherCost: number
  riceSaleRate: number
  brokenRiceSaleRate: number
  huskSaleRate: number
  polishSaleRate: number
}

type NumericField = {
  name: keyof ProductionOutputFormValues
  label: string
}

const outputFields: NumericField[] = [
  { name: "rice", label: "Rice" },
  { name: "brokenRice", label: "Broken Rice" },
  { name: "husk", label: "Husk" },
  { name: "polish", label: "Polish / Bran" },
  { name: "waste", label: "Waste" },
  { name: "shortage", label: "Moisture Loss / Shortage" },
]

const costFields: NumericField[] = [
  { name: "laborCost", label: "Labor Cost" },
  { name: "electricityCost", label: "Electricity Cost" },
  { name: "dryingCost", label: "Drying Cost" },
  { name: "packingCost", label: "Packing Cost" },
  { name: "transportCost", label: "Transport Cost" },
  { name: "loadingCost", label: "Loading / Unloading" },
  { name: "otherCost", label: "Other Cost" },
]

const saleRateFields: NumericField[] = [
  { name: "riceSaleRate", label: "Rice Sale Rate / KG" },
  { name: "brokenRiceSaleRate", label: "Broken Sale Rate / KG" },
  { name: "huskSaleRate", label: "Husk Sale Rate / KG" },
  { name: "polishSaleRate", label: "Polish Sale Rate / KG" },
]

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

export function ProductionOutputForm({
  paddyLotId,
  lotWeight,
  purchaseRate,
  initialData,
}: ProductionOutputFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ProductionOutputFormInput, unknown, ProductionOutputFormValues>({
    resolver: zodResolver(formSchema) as Resolver<ProductionOutputFormInput, unknown, ProductionOutputFormValues>,
    defaultValues: {
      paddyWeight: initialData?.paddyWeight || lotWeight,
      rice: initialData?.rice || 0,
      brokenRice: initialData?.brokenRice || 0,
      husk: initialData?.husk || 0,
      polish: initialData?.polish || 0,
      waste: initialData?.waste || 0,
      shortage: initialData?.shortage || 0,
      laborCost: initialData?.laborCost || 0,
      electricityCost: initialData?.electricityCost || 0,
      dryingCost: initialData?.dryingCost || 0,
      packingCost: initialData?.packingCost || 0,
      transportCost: initialData?.transportCost || 0,
      loadingCost: initialData?.loadingCost || 0,
      otherCost: initialData?.otherCost || 0,
      riceSaleRate: initialData?.riceSaleRate || 0,
      brokenRiceSaleRate: initialData?.brokenRiceSaleRate || 0,
      huskSaleRate: initialData?.huskSaleRate || 0,
      polishSaleRate: initialData?.polishSaleRate || 0,
    },
  })

  const values = form.watch()
  const summary = useMemo(
    () => calculateProductionSummary(values, purchaseRate),
    [values, purchaseRate]
  )

  async function onSubmit(data: ProductionOutputFormValues) {
    setIsSubmitting(true)
    try {
      await upsertProductionOutput(paddyLotId, data)
      router.refresh()
    } catch (error) {
      console.error(error)
      alert("Production output could not be saved.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <SummaryCard
          title="Total Recovery"
          value={`${summary.totalRecoveryPercent}%`}
          detail={`${formatKg(summary.saleableOutput)} saleable output`}
        />
        <SummaryCard
          title="Total Output"
          value={formatKg(summary.totalOutput)}
          detail={`${formatKg(summary.balanceDifference)} balance difference`}
        />
        <SummaryCard
          title="Rice Recovery"
          value={`${summary.riceRecoveryPercent}%`}
          detail={formatKg(values.rice)}
        />
        <SummaryCard
          title="Average Cost"
          value={formatMoney(summary.costPerSaleableKg)}
          detail="Per saleable output KG"
        />
        <SummaryCard
          title="Expected Profit"
          value={formatMoney(summary.grossProfit)}
          detail={`${summary.profitMarginPercent}% margin`}
        />
        <SummaryCard
          title="Total Lot Cost"
          value={formatMoney(summary.totalLotCost)}
          detail={`${formatMoney(summary.paddyCost)} paddy cost`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-600" />
            Production Output
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-4">
                <FormField
                  control={form.control}
                  name="paddyWeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paddy Weight (KG)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="rounded-lg border p-3">
                  <p className="text-sm font-medium text-muted-foreground">Purchase Rate</p>
                  <p className="text-xl font-semibold">{formatMoney(purchaseRate)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-sm font-medium text-muted-foreground">Processing Cost</p>
                  <p className="text-xl font-semibold">{formatMoney(summary.processingCost)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-sm font-medium text-muted-foreground">Expected Sale</p>
                  <p className="text-xl font-semibold">{formatMoney(summary.expectedSaleValue)}</p>
                </div>
              </div>

              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <PackageCheck className="h-4 w-4 text-emerald-600" />
                  Output Weights
                </h3>
                <div className="grid gap-4 md:grid-cols-3">
                  {outputFields.map((outputField) => (
                    <FormField
                      key={outputField.name}
                      control={form.control}
                      name={outputField.name}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{outputField.label} (KG)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <Banknote className="h-4 w-4 text-emerald-600" />
                  Processing Overheads
                </h3>
                <div className="grid gap-4 md:grid-cols-4">
                  {costFields.map((costField) => (
                    <FormField
                      key={costField.name}
                      control={form.control}
                      name={costField.name}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{costField.label}</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <BarChart3 className="h-4 w-4 text-emerald-600" />
                  Sale Rates
                </h3>
                <div className="grid gap-4 md:grid-cols-4">
                  {saleRateFields.map((saleRateField) => (
                    <FormField
                      key={saleRateField.name}
                      control={form.control}
                      name={saleRateField.name}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{saleRateField.label}</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Saving..." : "Save Output"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => form.reset()}
                >
                  <Recycle className="mr-2 h-4 w-4" />
                  Reset
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={isSubmitting}
                  onClick={() =>
                    form.reset({
                      paddyWeight: lotWeight,
                      rice: 0,
                      brokenRice: 0,
                      husk: 0,
                      polish: 0,
                      waste: 0,
                      shortage: 0,
                      laborCost: 0,
                      electricityCost: 0,
                      dryingCost: 0,
                      packingCost: 0,
                      transportCost: 0,
                      loadingCost: 0,
                      otherCost: 0,
                      riceSaleRate: 0,
                      brokenRiceSaleRate: 0,
                      huskSaleRate: 0,
                      polishSaleRate: 0,
                    })
                  }
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
