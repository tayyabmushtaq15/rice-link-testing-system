import { getTemplates } from "@/actions/templates"
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
import { Plus, Pencil, LayoutTemplate } from "lucide-react"
import Link from "next/link"
import { ToggleStatusButton } from "@/components/templates/ToggleStatusButton"

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; sort?: string; dir?: string }>
}) {
  const params = await searchParams
  const basePath = "/dashboard/templates"
  const list = await getTemplates({ page: params.page, sort: params.sort, dir: params.dir })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Report Templates</h1>
        <Link
          href="/dashboard/templates/new"
          className={buttonVariants({ className: "bg-emerald-600 hover:bg-emerald-700" })}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5 text-emerald-600" />
            Dynamic Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead
                  label="Template Name"
                  sortKey="name"
                  currentSort={list.sort}
                  currentDir={list.dir}
                  basePath={basePath}
                  searchParams={params}
                />
                <TableHead>Description</TableHead>
                <SortableTableHead
                  label="Attach To"
                  sortKey="attachTo"
                  currentSort={list.sort}
                  currentDir={list.dir}
                  basePath={basePath}
                  searchParams={params}
                />
                <TableHead>Fields Count</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No report templates found. Click &quot;Create Template&quot; to build one.
                  </TableCell>
                </TableRow>
              ) : (
                list.items.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {template.description || "-"}
                    </TableCell>
                    <TableCell>{template.attachTo}</TableCell>
                    <TableCell>{template._count.fields}</TableCell>
                    <TableCell>
                      <ToggleStatusButton id={template.id} isActive={template.isActive} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/dashboard/templates/${template.id}/edit`}
                        className={buttonVariants({ variant: "ghost", size: "icon" })}
                      >
                        <Pencil className="h-4 w-4 text-emerald-600" />
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
