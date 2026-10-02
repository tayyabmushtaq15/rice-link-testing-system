import Link from "next/link"
import { notFound } from "next/navigation"
import { getDispatch, updateDispatchStatus } from "@/actions/dispatch"
import { getCompanyProfile } from "@/actions/companyProfile"
import { ArrowLeft, History, Truck } from "lucide-react"
import { buttonVariants, Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ServerActionForm } from "@/components/ui/ServerActionForm"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DispatchPdfActionsClient } from "@/components/dispatch/DispatchPdfActionsClient"
import type { DispatchPdfData } from "@/components/dispatch/DispatchPdfDocument"

const postedStatuses = new Set(["DISPATCHED", "DELIVERED"])

export default async function DispatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const dispatch = await getDispatch((await params).id)
  if (!dispatch) notFound()
  const company = await getCompanyProfile()

  const totalQuantity = dispatch.lines.reduce((sum, line) => sum + Number(line.quantity), 0)
  const pdfData: DispatchPdfData = {
    dispatchNo: dispatch.dispatchNo,
    status: dispatch.status,
    dispatchDate: dispatch.dispatchDate.toLocaleDateString(),
    companyName: company?.name || "Ricely",
    companyAddress: [company?.address, company?.city].filter(Boolean).join(", "),
    companyPhone: company?.phone || "",
    customerName: dispatch.sale.customer.name,
    customerAddress: dispatch.sale.customer.address || "",
    invoiceNo: dispatch.sale.invoiceNo,
    godownName: dispatch.godown.name,
    vehicleNo: dispatch.vehicleNo || "",
    driverName: dispatch.driverName || "",
    deliveryNotes: dispatch.deliveryNotes || "",
    lines: dispatch.lines.map((line) => ({
      product: line.product.name,
      quantity: line.quantity.toString(),
      unit: line.product.unit.symbol,
    })),
    totalQuantity: totalQuantity.toLocaleString(),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/dispatch"
          className={buttonVariants({ variant: "outline", size: "icon" })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{dispatch.dispatchNo}</h1>
          <p className="mt-1 text-muted-foreground">
            Dispatch for {dispatch.sale.customer.name} · {dispatch.sale.invoiceNo}
          </p>
        </div>
        <Badge
          variant={
            dispatch.status === "DELIVERED"
              ? "secondary"
              : dispatch.status === "CANCELLED"
                ? "destructive"
                : "outline"
          }
        >
          {dispatch.status}
        </Badge>
        <DispatchPdfActionsClient dispatch={pdfData} compact />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-violet-600" />
                Dispatch Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground">Dispatch date</p>
                  <p className="font-medium">{dispatch.dispatchDate.toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Godown</p>
                  <p className="font-medium">{dispatch.godown.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Vehicle</p>
                  <p className="font-medium">{dispatch.vehicleNo || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Driver</p>
                  <p className="font-medium">{dispatch.driverName || "-"}</p>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dispatch.lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell>{line.product.name}</TableCell>
                      <TableCell>{line.quantity.toString()}</TableCell>
                      <TableCell>{line.product.unit.symbol}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-sm text-muted-foreground">
                {dispatch.deliveryNotes || "No delivery notes."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-violet-600" />
                Audit History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dispatch.statusHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">No status changes recorded yet.</p>
              ) : (
                <ul className="space-y-3">
                  {dispatch.statusHistory.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-start justify-between border-b pb-3 text-sm last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="font-medium">
                          {entry.fromStatus
                            ? `${entry.fromStatus.replaceAll("_", " ")} → ${entry.toStatus.replaceAll("_", " ")}`
                            : `Created as ${entry.toStatus.replaceAll("_", " ")}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.changedBy?.name || entry.changedBy?.email || "Unknown user"}
                          {entry.notes ? ` · ${entry.notes}` : ""}
                        </p>
                      </div>
                      <span className="whitespace-nowrap text-xs text-muted-foreground">
                        {entry.changedAt.toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Update Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {["LOADING", "DISPATCHED", "DELIVERED", "CANCELLED"].map((status) => {
              const locked = dispatch.status === "DELIVERED" || dispatch.status === "CANCELLED"
              const blockedCancel = status === "CANCELLED" && postedStatuses.has(dispatch.status)
              const disabled = locked || blockedCancel
              return (
                <ServerActionForm
                  key={status}
                  action={updateDispatchStatus.bind(null, dispatch.id, status)}
                >
                  <Button
                    type="submit"
                    variant={status === "CANCELLED" ? "destructive" : "outline"}
                    className="w-full"
                    disabled={disabled}
                    title={
                      blockedCancel
                        ? "Stock has already been posted for this dispatch; it cannot be cancelled directly."
                        : undefined
                    }
                  >
                    {status.replaceAll("_", " ")}
                    {status === "DISPATCHED" && " (deduct stock)"}
                  </Button>
                </ServerActionForm>
              )
            })}
            {postedStatuses.has(dispatch.status) && dispatch.status !== "DELIVERED" && (
              <p className="text-xs text-muted-foreground">
                Stock has already been posted for this dispatch, so it can no longer be cancelled.
                Use a stock adjustment to reverse it if required.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
