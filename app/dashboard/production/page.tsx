import Link from "next/link"
import { getProductionBatches } from "@/actions/productionBatches"
import { Factory, Plus } from "lucide-react"
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
  { value: "DRAFT", label: "Draft" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
]

export default async function ProductionPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; sort?: string; dir?: string }>
}) {
  const params = await searchParams
  const status = params.status || "ALL"
  const basePath = "/dashboard/production"
  const list = await getProductionBatches({ status, page: params.page, sort: params.sort, dir: params.dir })
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Production</h1>
          <p className="mt-1 text-muted-foreground">
            Create production batches, track yield, and post finished output to stock.
          </p>
        </div>
        <Link
          href="/dashboard/production/new"
          className={buttonVariants({ className: "bg-blue-600 hover:bg-blue-700" })}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Production Batch
        </Link>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5 text-blue-600" />
              Production Register
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
                <TableHead>Batch No.</TableHead>
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
                  label="Input"
                  sortKey="totalInput"
                  currentSort={list.sort}
                  currentDir={list.dir}
                  basePath={basePath}
                  searchParams={params}
                  defaultDir="desc"
                />
                <TableHead>Output Breakdown</TableHead>
                <TableHead>Yield</TableHead>
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
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    No production batches found. Click &quot;New Production Batch&quot; to record
                    one.
                  </TableCell>
                </TableRow>
              ) : (
                list.items.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/production/${batch.id}`}
                        className="text-blue-700 hover:underline"
                      >
                        {batch.batchNo}
                      </Link>
                    </TableCell>
                    <TableCell>{batch.productionDate.toLocaleDateString()}</TableCell>
                    <TableCell>{batch.totalInput.toString()} units</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {batch.outputs.map((output) => (
                          <span
                            key={output.id}
                            className="whitespace-nowrap rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-800"
                          >
                            {output.product.name}: {Number(output.quantity).toLocaleString()}{" "}
                            {output.product.unit.symbol}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {Number(batch.totalInput) > 0
                        ? `${((Number(batch.totalOutput) / Number(batch.totalInput)) * 100).toFixed(1)}%`
                        : "0.0%"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          batch.status === "COMPLETED"
                            ? "secondary"
                            : batch.status === "CANCELLED"
                              ? "destructive"
                              : "outline"
                        }
                      >
                        {batch.status.replaceAll("_", " ")}
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
