import { getMills } from "@/actions/mills"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Building2, Plus, Pencil } from "lucide-react"
import Link from "next/link"
import { EntitySearch } from "@/components/ui/EntitySearch"
import DeleteMillButton from "./DeleteMillButton"

export default async function MillsPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; page?: string; sort?: string; dir?: string }>
}) {
  const params = await searchParams
  const query = params.query || ""
  const basePath = "/dashboard/mills"
  const list = await getMills({ search: query, page: params.page, sort: params.sort, dir: params.dir })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Mills Management</h1>
        <Link
          href="/dashboard/mills/new"
          className={buttonVariants({ className: "bg-emerald-600 hover:bg-emerald-700" })}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Mill
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-600" />
              Registered Mills
            </CardTitle>
            <div className="w-72">
              <EntitySearch initialQuery={query} placeholder="Search mills..." />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead
                  label="Mill Name"
                  sortKey="name"
                  currentSort={list.sort}
                  currentDir={list.dir}
                  basePath={basePath}
                  searchParams={params}
                />
                <SortableTableHead
                  label="Owner"
                  sortKey="ownerName"
                  currentSort={list.sort}
                  currentDir={list.dir}
                  basePath={basePath}
                  searchParams={params}
                />
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No mills found.
                  </TableCell>
                </TableRow>
              ) : (
                list.items.map((mill) => (
                  <TableRow key={mill.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/mills/${mill.id}`}
                        className="hover:underline text-emerald-700"
                      >
                        {mill.name}
                      </Link>
                    </TableCell>
                    <TableCell>{mill.ownerName}</TableCell>
                    <TableCell>{mill.phone || "-"}</TableCell>
                    <TableCell>{mill.email || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/dashboard/mills/${mill.id}/edit`}
                          className={buttonVariants({ variant: "outline", size: "icon" })}
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <DeleteMillButton id={mill.id} millName={mill.name} />
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
