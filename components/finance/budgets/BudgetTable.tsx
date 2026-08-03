"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { deleteBudget } from "@/actions/finance/budgets"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Edit, Trash2 } from "lucide-react"

export type BudgetRow = {
  id: string
  categoryId: string
  categoryName: string
  month: string
  year: number
  budgetAmount: number
  spent: number
  remaining: number
  isOverspent: boolean
  utilizationPercent: number
}

interface BudgetTableProps {
  rows: BudgetRow[]
}

export function BudgetTable({ rows }: BudgetTableProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this budget?")) return
    setIsLoading(true)
    setError("")
    try {
      await deleteBudget(id)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete budget")
    } finally {
      setIsLoading(false)
    }
  }

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No budgets for this period. Create one to start tracking spend.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget vs Actual</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
        )}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead className="text-right">Spent</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.categoryName}</TableCell>
                  <TableCell>
                    {row.month} {row.year}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(row.budgetAmount)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.spent)}</TableCell>
                  <TableCell
                    className={`text-right font-medium ${
                      row.isOverspent ? "text-rose-600" : "text-emerald-600"
                    }`}
                  >
                    {formatCurrency(row.remaining)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.isOverspent ? "destructive" : "secondary"}>
                      {row.isOverspent ? "Overspent" : `${row.utilizationPercent}% used`}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Link href={`/dashboard/finance/budgets/${row.id}/edit`}>
                        <Button variant="ghost" size="sm" disabled={isLoading}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isLoading}
                        onClick={() => handleDelete(row.id)}
                      >
                        <Trash2 className="h-4 w-4 text-rose-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
