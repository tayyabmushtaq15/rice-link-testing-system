import Link from "next/link"
import { getPurchaseSetup } from "@/actions/purchases"
import { ArrowLeft, ShoppingCart } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PurchaseForm } from "@/components/purchases/PurchaseForm"

export default async function NewPurchasePage() {
  const [suppliers, products, godowns, mills, reportTemplates] = await getPurchaseSetup()
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/purchases"
          className={buttonVariants({ variant: "outline", size: "icon" })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Purchase</h1>
          <p className="mt-1 text-muted-foreground">
            Receive products into a godown and track supplier payment.
          </p>
        </div>
      </div>
      <Card className="max-w-5xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-emerald-600" />
            Purchase Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PurchaseForm
            suppliers={suppliers}
            products={products}
            godowns={godowns}
            mills={mills}
            reportTemplates={reportTemplates}
          />
        </CardContent>
      </Card>
    </div>
  )
}
