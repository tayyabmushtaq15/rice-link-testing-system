"use client"

import { useState } from "react"
import Link from "next/link"
import { deleteSalary } from "@/actions/finance/salaries"
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

interface Salary {
  id: string
  employee: { name: string }
  month: string
  year: number
  basicSalary: number
  allowances: number
  deductions: number
  bonus: number
  overtime: number
  netSalary: number
  paymentStatus: string
}

interface SalaryTableProps {
  salaries: Salary[]
  onDelete?: () => void
}

export function SalaryTable({ salaries, onDelete }: SalaryTableProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this salary record?")) return
    setIsLoading(true)
    setError("")
    try {
      await deleteSalary(id)
      onDelete?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete")
    } finally {
      setIsLoading(false)
    }
  }

  if (salaries.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No salary records found yet.
        </CardContent>
      </Card>
    )
  }

  const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Salary Records</CardTitle>
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
                <TableHead>Employee</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Basic</TableHead>
                <TableHead className="text-right">Allowances</TableHead>
                <TableHead className="text-right">Deductions</TableHead>
                <TableHead className="text-right">Net Salary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salaries.map((salary) => (
                <TableRow key={salary.id}>
                  <TableCell className="font-medium">{salary.employee.name}</TableCell>
                  <TableCell>
                    {monthNames[parseInt(salary.month)]} {salary.year}
                  </TableCell>
                  <TableCell className="text-right text-sm">{formatCurrency(salary.basicSalary)}</TableCell>
                  <TableCell className="text-right text-sm text-emerald-600">
                    +{formatCurrency(salary.allowances + salary.bonus + salary.overtime)}
                  </TableCell>
                  <TableCell className="text-right text-sm text-rose-600">
                    -{formatCurrency(salary.deductions)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(salary.netSalary)}</TableCell>
                  <TableCell>
                    <Badge variant={salary.paymentStatus === "PAID" ? "default" : "secondary"}>
                      {salary.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Link href={`/dashboard/finance/salaries/${salary.id}/edit`}>
                        <Button variant="ghost" size="sm" disabled={isLoading}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(salary.id)}
                        disabled={isLoading}
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
