import Link from "next/link"
import { getGodowns, toggleGodown } from "@/actions/godowns"
import { Warehouse, Plus, Pencil } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
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

export default async function GodownsPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; page?: string; sort?: string; dir?: string }>
}) {
  const params = await searchParams
  const query = params.query || ""
  const basePath = "/dashboard/godowns"
  const list = await getGodowns({ search: query, page: params.page, sort: params.sort, dir: params.dir })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Godowns</h1>
          <p className="mt-1 text-muted-foreground">
            Manage storage locations, capacity, and stock operations.
          </p>
        </div>
        <Link
          href="/dashboard/godowns/new"
          className={buttonVariants({ className: "bg-emerald-600 hover:bg-emerald-700" })}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Godown
        </Link>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5 text-emerald-600" />
              Storage Locations
            </CardTitle>
            <div className="w-72">
              <EntitySearch initialQuery={query} placeholder="Search godowns..." />
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
                <TableHead>Location</TableHead>
                <SortableTableHead
                  label="Capacity"
                  sortKey="capacity"
                  currentSort={list.sort}
                  currentDir={list.dir}
                  basePath={basePath}
                  searchParams={params}
                  defaultDir="desc"
                />
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    No godowns configured.
                  </TableCell>
                </TableRow>
              ) : (
                list.items.map((godown) => (
                  <TableRow key={godown.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/godowns/${godown.id}/edit`}
                        className="text-emerald-700 hover:underline"
                      >
                        {godown.name}
                      </Link>
                    </TableCell>
                    <TableCell>{godown.location || "-"}</TableCell>
                    <TableCell>
                      {Number(godown.capacity).toLocaleString()} {godown.unit.symbol}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/dashboard/godowns/${godown.id}/edit`}
                          className={buttonVariants({ variant: "outline", size: "icon" })}
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <DeactivateButton
                          itemName={godown.name}
                          action={toggleGodown.bind(null, godown.id, false)}
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
