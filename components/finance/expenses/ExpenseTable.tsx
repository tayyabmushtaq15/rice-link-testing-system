"use client"

import { useState } from "react"
import Link from "next/link"
import { softDeleteExpense } from "@/actions/finance/expenses"
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
import { formatCurrency } from "@/lib/utils"

interface Expense {
  id: string
  transactionNo: string
  date: Date
  category: {
    id: string
    name: string
  }
  vendorName: string | null
  amount: number
  paymentMethod: string
  description: string | null
  invoiceNumber: string | null
  createdBy?: {
    name: string | null
    email: string
  }
}

interface ExpenseTableProps {
  expenses: Expense[]
  onDelete?: () => void
}

export function ExpenseTable({ expenses, onDelete }: ExpenseTableProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense record? This action cannot be undone.")) {
      return
    }

    setIsLoading(true)
    setError("")
    try {
      await softDeleteExpense(id)
      onDelete?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete expense record")
    } finally {
      setIsLoading(false)
      setSelectedId(null)
    }
  }

  if (expenses.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No expenses found. Record your first expense to get started.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Records</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">{expense.transactionNo}</TableCell>
                  <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{expense.category.name}</Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{expense.vendorName || "-"}</p>
                      {expense.description && (
                        <p className="text-sm text-muted-foreground">{expense.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(expense.amount)}</TableCell>
                  <TableCell className="text-sm">{expense.paymentMethod}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Link href={`/dashboard/finance/expenses/${expense.id}/edit`}>
                        <Button variant="ghost" size="sm" disabled={isLoading}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(expense.id)}
                        disabled={isLoading || selectedId === expense.id}
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
      </CardContent>
    </Card>
  )
}
