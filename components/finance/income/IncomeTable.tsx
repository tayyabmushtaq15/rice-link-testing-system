"use client"

import { useState } from "react"
import Link from "next/link"
import { deleteIncome } from "@/actions/finance/income"
import { Button } from "@/components/ui/button"
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
import { Edit, Trash2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import type { SortDir } from "@/lib/listQuery"

interface Income {
  id: string
  transactionNo: string
  date: Date
  source: string
  amount: number
  paymentMethod: string
  description: string | null
  createdBy?: {
    name: string | null
    email: string
  }
}

interface IncomeTableProps {
  incomeList: Income[]
  onDelete?: () => void
  total: number
  page: number
  pageSize: number
  totalPages: number
  sort: string
  dir: SortDir
  basePath: string
  searchParams: Record<string, string | string[] | undefined>
}

export function IncomeTable({
  incomeList,
  onDelete,
  total,
  page,
  pageSize,
  totalPages,
  sort,
  dir,
  basePath,
  searchParams,
}: IncomeTableProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this income record?")) {
      return
    }

    setIsLoading(true)
    setError("")
    try {
      await deleteIncome(id)
      onDelete?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete income record")
    } finally {
      setIsLoading(false)
      setSelectedId(null)
    }
  }

  if (incomeList.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No income records found. Record your first income to get started.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Income Records</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction No</TableHead>
                <SortableTableHead
                  label="Date"
                  sortKey="date"
                  currentSort={sort}
                  currentDir={dir}
                  basePath={basePath}
                  searchParams={searchParams}
                  defaultDir="desc"
                />
                <SortableTableHead
                  label="Source"
                  sortKey="source"
                  currentSort={sort}
                  currentDir={dir}
                  basePath={basePath}
                  searchParams={searchParams}
                />
                <SortableTableHead
                  label="Amount"
                  sortKey="amount"
                  className="text-right"
                  currentSort={sort}
                  currentDir={dir}
                  basePath={basePath}
                  searchParams={searchParams}
                  defaultDir="desc"
                />
                <TableHead>Method</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incomeList.map((income) => (
                <TableRow key={income.id}>
                  <TableCell className="font-medium">{income.transactionNo}</TableCell>
                  <TableCell>{new Date(income.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{income.source}</p>
                      {income.description && (
                        <p className="text-sm text-muted-foreground">{income.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(income.amount)}
                  </TableCell>
                  <TableCell className="text-sm">{income.paymentMethod}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Link href={`/dashboard/finance/income/${income.id}/edit`}>
                        <Button variant="ghost" size="sm" disabled={isLoading}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(income.id)}
                        disabled={isLoading || selectedId === income.id}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
          basePath={basePath}
          searchParams={searchParams}
        />
      </CardContent>
    </Card>
  )
}
