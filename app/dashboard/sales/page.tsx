import Link from "next/link"
import { getSales } from "@/actions/sales"
import { Plus, Wallet } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; status?: string; page?: string; sort?: string; dir?: string }>
}) {
  const params = await searchParams
  const query = params.query?.trim() || ""
  const status = params.status || "ALL"
  const basePath = "/dashboard/sales"
  const list = await getSales({ query, status, page: params.page, sort: params.sort, dir: params.dir })
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales</h1>
          <p className="mt-1 text-muted-foreground">
            Create invoices, track customer payments, and prepare dispatches.
          </p>
        </div>
        <Link
          href="/dashboard/sales/new"
          className={buttonVariants({ className: "bg-emerald-600 hover:bg-emerald-700" })}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Sale
        </Link>
      </div>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-emerald-600" />
              Sales Register
            </CardTitle>
            <form className="flex gap-2" method="get">
              <Input
                name="query"
                defaultValue={query}
                placeholder="Search invoice or customer..."
              />
              <select
                name="status"
                defaultValue={status}
                className="h-9 rounded-md border bg-transparent px-3 text-sm"
              >
                <option value="ALL">All</option>
                <option value="UNPAID">Unpaid</option>
                <option value="PARTIAL">Partial</option>
                <option value="PAID">Paid</option>
              </select>
              <input type="hidden" name="sort" value={list.sort} />
              <input type="hidden" name="dir" value={list.dir} />
              <button className="h-9 rounded-md bg-slate-900 px-3 text-sm text-white" type="submit">
                Filter
              </button>
            </form>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice No.</TableHead>
                <SortableTableHead
                  label="Date"
                  sortKey="date"
                  currentSort={list.sort}
                  currentDir={list.dir}
                  basePath={basePath}
                  searchParams={params}
                  defaultDir="desc"
                />
                <SortableTableHead
                  label="Customer"
                  sortKey="customer"
                  currentSort={list.sort}
                  currentDir={list.dir}
                  basePath={basePath}
                  searchParams={params}
                />
                <SortableTableHead
                  label="Total"
                  sortKey="total"
                  currentSort={list.sort}
                  currentDir={list.dir}
                  basePath={basePath}
                  searchParams={params}
                  defaultDir="desc"
                />
                <TableHead>Received</TableHead>
                <TableHead>Remaining</TableHead>
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
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    No sales found. Click &quot;New Sale&quot; to record one.
                  </TableCell>
                </TableRow>
              ) : (
                list.items.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/sales/${sale.id}`}
                        className="text-emerald-700 hover:underline"
                      >
                        {sale.invoiceNo}
                      </Link>
                    </TableCell>
                    <TableCell>{sale.invoiceDate.toLocaleDateString()}</TableCell>
                    <TableCell>{sale.customer.name}</TableCell>
                    <TableCell>PKR {Number(sale.totalAmount).toLocaleString()}</TableCell>
                    <TableCell>PKR {Number(sale.receivedAmount).toLocaleString()}</TableCell>
                    <TableCell>
                      PKR{" "}
                      {(Number(sale.totalAmount) - Number(sale.receivedAmount)).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          sale.status === "PAID"
                            ? "text-emerald-700"
                            : sale.status === "PARTIAL"
                              ? "text-amber-700"
                              : "text-red-600"
                        }
                      >
                        {sale.status}
                      </span>
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
