import Link from "next/link"
import { getDispatches } from "@/actions/dispatch"
import { Plus, Truck } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusFilterSelect } from "@/components/ui/StatusFilterSelect"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SortableTableHead } from "@/components/ui/SortableTableHead"
import { Pagination } from "@/components/ui/Pagination"

const statusOptions = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "LOADING", label: "Loading" },
  { value: "DISPATCHED", label: "Dispatched" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
]

export default async function DispatchPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; sort?: string; dir?: string }>
}) {
  const params = await searchParams
  const status = params.status || "ALL"
  const basePath = "/dashboard/dispatch"
  const list = await getDispatches({ status, page: params.page, sort: params.sort, dir: params.dir })
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dispatch</h1>
          <p className="mt-1 text-muted-foreground">
            Fulfil sales invoices and track delivery from your godowns.
          </p>
        </div>
        <Link
          href="/dashboard/dispatch/new"
          className={buttonVariants({ className: "bg-violet-600 hover:bg-violet-700" })}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Dispatch
        </Link>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-violet-600" />
              Dispatch Register
            </CardTitle>
            <form method="get">
              <StatusFilterSelect status={status} options={statusOptions} />
              <input type="hidden" name="sort" value={list.sort} />
              <input type="hidden" name="dir" value={list.dir} />
            </form>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dispatch No.</TableHead>
                <SortableTableHead
                  label="Date"
                  sortKey="date"
                  currentSort={list.sort}
                  currentDir={list.dir}
                  basePath={basePath}
                  searchParams={params}
                  defaultDir="desc"
                />
                <TableHead>Customer</TableHead>
                <TableHead>Sale Invoice</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Godown</TableHead>
                <TableHead>Vehicle</TableHead>
                <SortableTableHead
                  label="Status"
                  sortKey="status"
                  currentSort={list.sort}
                  currentDir={list.dir}
                  basePath={basePath}
                  searchParams={params}
                />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                    No dispatches found. Click &quot;New Dispatch&quot; to create one.
                  </TableCell>
                </TableRow>
              ) : (
                list.items.map((dispatch) => (
                  <TableRow key={dispatch.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/dispatch/${dispatch.id}`}
                        className="text-violet-700 hover:underline"
                      >
                        {dispatch.dispatchNo}
                      </Link>
                    </TableCell>
                    <TableCell>{dispatch.dispatchDate.toLocaleDateString()}</TableCell>
                    <TableCell>{dispatch.sale.customer.name}</TableCell>
                    <TableCell>{dispatch.sale.invoiceNo}</TableCell>
                    <TableCell>
                      {dispatch.lines.map((line) => line.product.name).join(", ")}
                    </TableCell>
                    <TableCell>
                      {dispatch.lines
                        .reduce((sum, line) => sum + Number(line.quantity), 0)
                        .toLocaleString()}
                    </TableCell>
                    <TableCell>{dispatch.godown.name}</TableCell>
                    <TableCell>{dispatch.vehicleNo || "-"}</TableCell>
                    <TableCell>
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
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Pagination
            page={list.page}
            pageSize={list.pageSize}
            total={list.total}
            totalPages={list.totalPages}
            basePath={basePath}
            searchParams={params}
          />
        </CardContent>
      </Card>
    </div>
  )
}
