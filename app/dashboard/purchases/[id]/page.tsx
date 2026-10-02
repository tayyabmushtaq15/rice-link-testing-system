import Link from "next/link"
import { notFound } from "next/navigation"
import { getPurchase, updatePurchasePayment } from "@/actions/purchases"
import { ArrowLeft, FileCheck, Pencil, Receipt } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ServerActionForm } from "@/components/ui/ServerActionForm"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default async function PurchaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const purchase = await getPurchase((await params).id)
  if (!purchase) notFound()
  const remaining = Number(purchase.totalAmount) - Number(purchase.paidAmount)
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/purchases"
          className={buttonVariants({ variant: "outline", size: "icon" })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{purchase.purchaseNo}</h1>
          <p className="mt-1 text-muted-foreground">Purchase from {purchase.supplier.name}</p>
        </div>
        <Link
          href={`/dashboard/purchases/${purchase.id}/edit`}
          className={buttonVariants({ variant: "outline" })}
        >
          <Pencil className="mr-2 h-4 w-4" />
          Edit Purchase
        </Link>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-emerald-600" />
              Purchase Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Invoice number</p>
                <p className="font-medium">{purchase.invoiceNumber || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Purchase date</p>
                <p className="font-medium">{purchase.purchaseDate.toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Supplier</p>
                <p className="font-medium">{purchase.supplier.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Godown</p>
                <p className="font-medium">{purchase.godown.name}</p>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchase.lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>{line.product.name}</TableCell>
                    <TableCell>
                      {line.quantity.toString()} {line.product.unit.symbol}
                    </TableCell>
                    <TableCell>PKR {Number(line.unitRate).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      PKR {Number(line.lineTotal).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="grid gap-2 border-t pt-4 text-right text-sm">
              <p>Transport cost: PKR {Number(purchase.transportCost).toLocaleString()}</p>
              <p>Other cost: PKR {Number(purchase.otherCost).toLocaleString()}</p>
              <p className="text-lg font-bold">
                Grand total: PKR {Number(purchase.totalAmount).toLocaleString()}
              </p>
              <p className="text-muted-foreground">Remaining: PKR {remaining.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Update Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <ServerActionForm
              key={purchase.updatedAt.getTime()}
              action={updatePurchasePayment}
              className="space-y-4"
            >
              <input type="hidden" name="id" value={purchase.id} />
              <div>
                <Label htmlFor="paidAmount">Amount paid</Label>
                <Input
                  id="paidAmount"
                  name="paidAmount"
                  type="number"
                  min="0"
                  max={Number(purchase.totalAmount)}
                  step="0.01"
                  defaultValue={Number(purchase.paidAmount)}
                />
              </div>
              <div>
                <Label htmlFor="paymentMethod">Payment method</Label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  defaultValue={purchase.paymentMethod}
                  className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                Save Payment
              </Button>
            </ServerActionForm>
          </CardContent>
        </Card>
        {purchase.reports.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-emerald-600" />
                Quality Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {purchase.reports.map((report) => (
                  <li key={report.id} className="flex items-center justify-between text-sm">
                    <Link
                      href={`/dashboard/reports/${report.id}`}
                      className="font-medium text-emerald-700 hover:underline"
                    >
                      {report.template.name}
                    </Link>
                    <Badge variant={report.status === "APPROVED" ? "default" : "secondary"}>
                      {report.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
