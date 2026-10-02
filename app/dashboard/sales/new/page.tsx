import Link from "next/link"
import { getSaleSetup } from "@/actions/sales"
import { ArrowLeft, Wallet } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SaleForm } from "@/components/sales/SaleForm"

export default async function NewSalePage() {
  const [customers, products, godowns] = await getSaleSetup()
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/sales"
          className={buttonVariants({ variant: "outline", size: "icon" })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Sale</h1>
          <p className="mt-1 text-muted-foreground">
            Create an invoice and track customer payment.
          </p>
        </div>
      </div>
      <Card className="max-w-5xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-emerald-600" />
            Sales Invoice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SaleForm customers={customers} products={products} godowns={godowns} />
        </CardContent>
      </Card>
    </div>
  )
}
