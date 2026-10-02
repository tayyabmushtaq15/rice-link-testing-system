import Link from "next/link"
import { getProductionBatchSetup } from "@/actions/productionBatches"
import { ArrowLeft, Factory } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProductionBatchForm } from "@/components/production/ProductionBatchForm"

export default async function NewProductionBatchPage() {
  const [godowns, products, reportTemplates] = await getProductionBatchSetup()
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/production"
          className={buttonVariants({ variant: "outline", size: "icon" })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Production Batch</h1>
          <p className="mt-1 text-muted-foreground">
            Transform raw material into finished products and by-products.
          </p>
        </div>
      </div>
      <Card className="max-w-5xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Factory className="h-5 w-5 text-blue-600" />
            Production Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProductionBatchForm godowns={godowns} products={products} reportTemplates={reportTemplates} />
        </CardContent>
      </Card>
    </div>
  )
}
