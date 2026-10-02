import Link from "next/link"
import { notFound } from "next/navigation"
import { getSale, updateSalePayment } from "@/actions/sales"
import { ArrowLeft, Receipt } from "lucide-react"
import { buttonVariants, Button } from "@/components/ui/button"
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

export default async function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const sale = await getSale((await params).id)
  if (!sale) notFound()
  const remaining = Number(sale.totalAmount) - Number(sale.receivedAmount)
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
          <h1 className="text-3xl font-bold tracking-tight">{sale.invoiceNo}</h1>
          <p className="mt-1 text-muted-foreground">Sale to {sale.customer.name}</p>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-emerald-600" />
              Invoice Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Sale date</p>
                <p className="font-medium">{sale.invoiceDate.toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Dispatch from</p>
                <p className="font-medium">{sale.godown.name}</p>
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
                {sale.lines.map((line) => (
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
            <div className="space-y-1 border-t pt-4 text-right text-sm">
              <p>Discount: PKR {Number(sale.discount).toLocaleString()}</p>
              <p>Transport: PKR {Number(sale.transportCost).toLocaleString()}</p>
              {Number(sale.taxAmount) > 0 && (
                <p>
                  Tax ({Number(sale.taxRate)}%): PKR {Number(sale.taxAmount).toLocaleString()}
                </p>
              )}
              <p className="text-lg font-bold">
                Grand total: PKR {Number(sale.totalAmount).toLocaleString()}
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
              key={sale.updatedAt.getTime()}
              action={updateSalePayment}
              className="space-y-4"
            >
              <input type="hidden" name="id" value={sale.id} />
              <div>
                <Label htmlFor="receivedAmount">Amount received</Label>
                <Input
                  id="receivedAmount"
                  name="receivedAmount"
                  type="number"
                  min="0"
                  max={Number(sale.totalAmount)}
                  step="0.01"
                  defaultValue={Number(sale.receivedAmount)}
                />
              </div>
              <div>
                <Label htmlFor="paymentMethod">Payment method</Label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  defaultValue={sale.paymentMethod}
                  className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK">Bank</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                Save Payment
              </Button>
            </ServerActionForm>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
