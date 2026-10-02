import Link from "next/link"
import { getProducts, toggleProduct } from "@/actions/products"
import { Package, Plus, Pencil, Settings2 } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EntitySearch } from "@/components/ui/EntitySearch"
import { DeactivateButton } from "@/components/ui/DeactivateButton"
import { SortableTableHead } from "@/components/ui/SortableTableHead"
import { Pagination } from "@/components/ui/Pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; page?: string; sort?: string; dir?: string }>
}) {
  const params = await searchParams
  const query = params.query || ""
  const basePath = "/dashboard/products"
  const list = await getProducts({ search: query, page: params.page, sort: params.sort, dir: params.dir })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="mt-1 text-muted-foreground">
            Define raw materials, finished rice, by-products, and packaging.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/products/settings"
            className={buttonVariants({ variant: "outline" })}
          >
            <Settings2 className="mr-2 h-4 w-4" />
            Categories &amp; Units
          </Link>
          <Link
            href="/dashboard/products/new"
            className={buttonVariants({ className: "bg-emerald-600 hover:bg-emerald-700" })}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </div>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-emerald-600" />
              Product Catalog
            </CardTitle>
            <div className="w-72">
              <EntitySearch initialQuery={query} placeholder="Search products..." />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead
                  label="Name"
                  sortKey="name"
                  currentSort={list.sort}
                  currentDir={list.dir}
                  basePath={basePath}
                  searchParams={params}
                />
                <TableHead>SKU</TableHead>
                <SortableTableHead
                  label="Type"
                  sortKey="type"
                  currentSort={list.sort}
                  currentDir={list.dir}
                  basePath={basePath}
                  searchParams={params}
                />
                <SortableTableHead
                  label="Category"
                  sortKey="category"
                  currentSort={list.sort}
                  currentDir={list.dir}
                  basePath={basePath}
                  searchParams={params}
                />
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No products configured.
                  </TableCell>
                </TableRow>
              ) : (
                list.items.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/products/${product.id}/edit`}
                        className="text-emerald-700 hover:underline"
                      >
                        {product.name}
                      </Link>
                      {product.requiresQa && (
                        <Badge variant="outline" className="ml-2">
                          QA
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{product.sku || "-"}</TableCell>
                    <TableCell>{product.type.replace("_", " ")}</TableCell>
                    <TableCell>{product.category?.name || "-"}</TableCell>
                    <TableCell>{product.unit.symbol}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/dashboard/products/${product.id}/edit`}
                          className={buttonVariants({ variant: "outline", size: "icon" })}
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <DeactivateButton
                          itemName={product.name}
                          action={toggleProduct.bind(null, product.id, false)}
                        />
                      </div>
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
