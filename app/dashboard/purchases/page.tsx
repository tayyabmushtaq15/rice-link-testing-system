import Link from "next/link"
import { auth } from "@/auth"
import { Pencil, Plus, ShoppingCart } from "lucide-react"
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
import { getPurchases } from "@/actions/purchases"

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; status?: string; page?: string; sort?: string; dir?: string }>
}) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") return null
  const params = await searchParams
  const query = params.query?.trim() || ""
  const status = params.status || "ALL"
  const basePath = "/dashboard/purchases"
  const list = await getPurchases({
    query,
    status,
    page: params.page,
    sort: params.sort,
    dir: params.dir,
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchases</h1>
          <p className="mt-1 text-muted-foreground">
            Record purchases, receive products, and track supplier balances.
          </p>
        </div>
        <Link
          href="/dashboard/purchases/new"
          className={buttonVariants({ className: "bg-emerald-600 hover:bg-emerald-700" })}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Purchase
        </Link>
      </div>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-emerald-600" />
              Purchase Register
            </CardTitle>
            <form className="flex gap-2" method="get">
              <Input
                name="query"
                defaultValue={query}
                placeholder="Search invoice or supplier..."
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
                <TableHead>Purchase No.</TableHead>
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
                  label="Supplier"
                  sortKey="supplier"
                  currentSort={list.sort}
                  currentDir={list.dir}
                  basePath={basePath}
                  searchParams={params}
                />
                <TableHead>Godown</TableHead>
                <SortableTableHead
                  label="Total"
                  sortKey="total"
                  currentSort={list.sort}
                  currentDir={list.dir}
                  basePath={basePath}
                  searchParams={params}
                  defaultDir="desc"
                />
                <TableHead>Paid</TableHead>
                <TableHead>Remaining</TableHead>
                <SortableTableHead
                  label="Status"
                  sortKey="status"
                  currentSort={list.sort}
                  currentDir={list.dir}
                  basePath={basePath}
                  searchParams={params}
                />
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                    No purchases found. Click &quot;New Purchase&quot; to record one.
                  </TableCell>
                </TableRow>
              ) : (
                list.items.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/purchases/${purchase.id}`}
                        className="text-emerald-700 hover:underline"
                      >
                        {purchase.purchaseNo}
                      </Link>
                    </TableCell>
                    <TableCell>{purchase.purchaseDate.toLocaleDateString()}</TableCell>
                    <TableCell>{purchase.supplier.name}</TableCell>
                    <TableCell>{purchase.godown.name}</TableCell>
                    <TableCell>PKR {Number(purchase.totalAmount).toLocaleString()}</TableCell>
                    <TableCell>PKR {Number(purchase.paidAmount).toLocaleString()}</TableCell>
                    <TableCell>
                      PKR{" "}
                      {(
                        Number(purchase.totalAmount) - Number(purchase.paidAmount)
                      ).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          purchase.status === "PAID"
                            ? "text-emerald-700"
                            : purchase.status === "PARTIAL"
                              ? "text-amber-700"
                              : "text-red-600"
                        }
                      >
                        {purchase.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/purchases/${purchase.id}/edit`}
                        className={buttonVariants({ variant: "ghost", size: "icon" })}
                        title="Edit purchase"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
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
