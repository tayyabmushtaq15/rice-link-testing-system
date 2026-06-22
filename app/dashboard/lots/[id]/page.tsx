import { getPaddyLot } from "@/actions/paddyLots"
import { ProductionPdfActions } from "@/components/production/ProductionPdfActions"
import { ProductionOutputForm } from "@/components/production/ProductionOutputForm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { buildProductionPdfData } from "@/lib/productionPdf"
import { FileText, ArrowLeft, Factory, User, Calendar, Settings, FileSearch, Scale, Droplets, CircleDollarSign } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function LotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const lot = await getPaddyLot(id)

  if (!lot) {
    notFound()
  }

  const productionPdf = lot.productionOutput
    ? buildProductionPdfData({
        ...lot,
        productionOutput: lot.productionOutput,
      })
    : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/lots" className={buttonVariants({ variant: "outline", size: "icon" })}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-emerald-600" />
            <h1 className="text-3xl font-bold tracking-tight">{lot.lotNumber}</h1>
            <Badge variant={
              lot.status === "OPEN" ? "default" :
              lot.status === "PROCESSING" ? "secondary" : "outline"
            } className={
              lot.status === "OPEN" ? "bg-emerald-100 text-emerald-800 border-none" : ""
            }>
              {lot.status}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {productionPdf && <ProductionPdfActions report={productionPdf} />}
          <Link href={`/dashboard/lots/${lot.id}/edit`} className={buttonVariants({ variant: "outline" })}>
            Edit Lot
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Factory className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Receiving Mill</p>
                <p className="text-muted-foreground">{lot.mill.name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Supplier</p>
                <p className="text-muted-foreground">{lot.supplierName}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Settings className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Variety & Crop Year</p>
                <p className="text-muted-foreground">{lot.variety} - {lot.cropYear}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Purchase Date</p>
                <p className="text-muted-foreground">{lot.purchaseDate.toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Purchase Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Scale className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Total Weight</p>
                <p className="text-muted-foreground">{lot.weight.toLocaleString()} KG</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Droplets className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Moisture Content</p>
                <p className="text-muted-foreground">{lot.moisture}%</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CircleDollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Purchase Rate</p>
                <p className="text-muted-foreground">PKR {lot.purchaseRate.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-dashed border-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileSearch className="h-5 w-5 text-muted-foreground" />
              Attached Quality Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground mb-4">No quality reports attached yet.</p>
              <Button variant="outline" disabled>Add Quality Report</Button>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2">
          <ProductionOutputForm
            paddyLotId={lot.id}
            lotWeight={lot.weight}
            purchaseRate={lot.purchaseRate}
            initialData={lot.productionOutput}
          />
        </div>

      </div>
    </div>
  )
}
