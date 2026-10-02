import { getStockOperationSetup, getStockSummary } from "@/actions/stock"
import { Package, Warehouse, ArrowDownToLine, ArrowUpFromLine } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StockOperationForms } from "@/components/stock/StockOperationForms"
import { SortableTableHead } from "@/components/ui/SortableTableHead"
import { Pagination } from "@/components/ui/Pagination"

function formatQuantity(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 3 })
}

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<{
    product?: string
    godown?: string
    page?: string
    sort?: string
    dir?: string
  }>
}) {
  const params = await searchParams
  const basePath = "/dashboard/stock"
  const [stock, [products, godowns]] = await Promise.all([
    getStockSummary({
      productId: params.product,
      godownId: params.godown,
      page: params.page,
      sort: params.sort,
      dir: params.dir,
    }),
    getStockOperationSetup(),
  ])
  const totalQuantity = stock.godownBalances.reduce((sum, entry) => sum + entry.quantity, 0)
  const totalValue = stock.balances.reduce((sum, entry) => sum + entry.value, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Stock</h1>
        <p className="mt-1 text-muted-foreground">
          Track product balances, storage capacity, and every stock movement.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Products With Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stock.balances.filter((entry) => entry.quantity > 0).length}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Across active products</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Quantity In Godowns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatQuantity(totalQuantity)}</div>
            <p className="mt-1 text-xs text-muted-foreground">Movement-derived balance</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Estimated Stock Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              PKR {totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Weighted receipt cost basis</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3 rounded-lg border bg-white p-4">
        <form className="flex flex-wrap gap-3" method="get">
          <select
            name="product"
            defaultValue={params.product || "all"}
            className="h-9 rounded-md border bg-transparent px-3 text-sm"
          >
            <option value="all">All products</option>
            {stock.products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
          <select
            name="godown"
            defaultValue={params.godown || "all"}
            className="h-9 rounded-md border bg-transparent px-3 text-sm"
          >
            <option value="all">All godowns</option>
            {stock.godowns.map((godown) => (
              <option key={godown.id} value={godown.id}>
                {godown.name}
              </option>
            ))}
          </select>
          <input type="hidden" name="sort" value={stock.sort} />
          <input type="hidden" name="dir" value={stock.dir} />
          <button
            type="submit"
            className="h-9 rounded-md bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Apply Filters
          </button>
        </form>
      </div>

      <StockOperationForms
        products={products.map((product) => ({
          id: product.id,
          name: product.name,
          unit: { symbol: product.unit.symbol },
        }))}
        godowns={godowns.map((godown) => ({ id: godown.id, name: godown.name }))}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-emerald-600" />
              Product Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stock.balances.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      No stock movements yet. Receive a purchase to create stock.
                    </TableCell>
                  </TableRow>
                ) : (
                  stock.balances.map((entry) => (
                    <TableRow key={entry.productId}>
                      <TableCell className="font-medium">{entry.productName}</TableCell>
                      <TableCell>
                        {formatQuantity(entry.quantity)} {entry.symbol}
                      </TableCell>
                      <TableCell>
                        PKR {entry.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <span className={entry.quantity > 0 ? "text-emerald-700" : "text-red-600"}>
                          {entry.quantity > 0 ? "In Stock" : "Out of Stock"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5 text-emerald-600" />
              Godown Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Godown</TableHead>
                  <TableHead>Used</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stock.godownBalances.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      No godown balances yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  stock.godownBalances.map((entry) => (
                    <TableRow key={entry.godownId}>
                      <TableCell className="font-medium">{entry.godownName}</TableCell>
                      <TableCell>
                        {formatQuantity(entry.quantity)} {entry.symbol}
                      </TableCell>
                      <TableCell>
                        {formatQuantity(entry.capacity)} {entry.symbol}
                      </TableCell>
                      <TableCell>
                        {entry.capacity > 0 && entry.quantity / entry.capacity >= 0.9 ? (
                          <span className="text-amber-700">Near Capacity</span>
                        ) : (
                          <span className="text-emerald-700">Available</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock Movement Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead
                  label="Date"
                  sortKey="date"
                  currentSort={stock.sort}
                  currentDir={stock.dir}
                  basePath={basePath}
                  searchParams={params}
                  defaultDir="desc"
                />
                <SortableTableHead
                  label="Product"
                  sortKey="product"
                  currentSort={stock.sort}
                  currentDir={stock.dir}
                  basePath={basePath}
                  searchParams={params}
                />
                <SortableTableHead
                  label="Godown"
                  sortKey="godown"
                  currentSort={stock.sort}
                  currentDir={stock.dir}
                  basePath={basePath}
                  searchParams={params}
                />
                <TableHead>Source</TableHead>
                <TableHead>In</TableHead>
                <TableHead>Out</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stock.movements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No movements recorded.
                  </TableCell>
                </TableRow>
              ) : (
                stock.movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>{movement.occurredAt.toLocaleString()}</TableCell>
                    <TableCell>{movement.product.name}</TableCell>
                    <TableCell>{movement.godown.name}</TableCell>
                    <TableCell>{movement.sourceType}</TableCell>
                    <TableCell className="text-emerald-700">
                      <ArrowDownToLine className="mr-1 inline h-4 w-4" />
                      {formatQuantity(Number(movement.quantityIn))}
                    </TableCell>
                    <TableCell className="text-red-600">
                      <ArrowUpFromLine className="mr-1 inline h-4 w-4" />
                      {formatQuantity(Number(movement.quantityOut))}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Pagination
            page={stock.movementsPage}
            pageSize={stock.movementsPageSize}
            total={stock.movementsTotal}
            totalPages={stock.movementsTotalPages}
            basePath={basePath}
            searchParams={params}
          />
        </CardContent>
      </Card>
    </div>
  )
}
