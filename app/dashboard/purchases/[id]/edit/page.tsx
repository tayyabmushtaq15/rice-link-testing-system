import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { getPurchase, getPurchaseEditability, getPurchaseSetup } from "@/actions/purchases"
import { PurchaseForm } from "@/components/purchases/PurchaseForm"

export default async function EditPurchasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [purchase, editability, [suppliers, products, godowns, mills]] = await Promise.all([
    getPurchase(id),
    getPurchaseEditability(id),
    getPurchaseSetup(),
  ])
  if (!purchase) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/purchases/${id}`}
          className={buttonVariants({ variant: "outline", size: "icon" })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Purchase</h1>
          <p className="mt-1 text-muted-foreground">{purchase.purchaseNo}</p>
        </div>
      </div>
      <PurchaseForm
        suppliers={suppliers}
        products={products}
        godowns={godowns}
        mills={mills}
        locked={editability.locked}
        lockedLines={editability.lockedLines}
        initialData={{
          id: purchase.id,
          supplierId: purchase.supplierId,
          godownId: purchase.godownId,
          millId: purchase.millId,
          purchaseDate: purchase.purchaseDate.toISOString().slice(0, 10),
          invoiceNumber: purchase.invoiceNumber,
          transportCost: purchase.transportCost.toString(),
          otherCost: purchase.otherCost.toString(),
          paidAmount: purchase.paidAmount.toString(),
          paymentMethod: purchase.paymentMethod,
          notes: purchase.notes,
          lines: purchase.lines.map((line) => ({
            id: line.id,
            productId: line.productId,
            quantity: line.quantity.toString(),
            unitRate: line.unitRate.toString(),
          })),
        }}
      />
    </div>
  )
}
