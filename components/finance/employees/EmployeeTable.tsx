"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  activateEmployee,
  deactivateEmployee,
} from "@/actions/finance/employees"
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
import { Edit, UserCheck, UserX } from "lucide-react"

type EmployeeRow = {
  id: string
  name: string
  department: string
  designation: string
  basicSalary: number
  status: string
  _count?: { salaries: number; expenses: number }
}

interface EmployeeTableProps {
  employees: EmployeeRow[]
}

export function EmployeeTable({ employees }: EmployeeTableProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState("")

  const toggleStatus = async (id: string, status: string) => {
    setLoadingId(id)
    setError("")
    try {
      if (status === "ACTIVE") {
        await deactivateEmployee(id)
      } else {
        await activateEmployee(id)
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status")
    } finally {
      setLoadingId(null)
    }
  }

  if (employees.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No employees yet. Add staff so salaries and expenses can use their details.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Employees</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
        )}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead className="text-right">Basic Salary</TableHead>
                <TableHead>Records</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-28">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">{emp.name}</TableCell>
                  <TableCell>{emp.department}</TableCell>
                  <TableCell>{emp.designation}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(emp.basicSalary)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {emp._count?.salaries ?? 0} salaries · {emp._count?.expenses ?? 0} expenses
                  </TableCell>
                  <TableCell>
                    <Badge variant={emp.status === "ACTIVE" ? "default" : "secondary"}>
                      {emp.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Link href={`/dashboard/finance/employees/${emp.id}/edit`}>
                        <Button variant="ghost" size="sm" disabled={!!loadingId}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={loadingId === emp.id}
                        title={emp.status === "ACTIVE" ? "Deactivate" : "Activate"}
                        onClick={() => toggleStatus(emp.id, emp.status)}
                      >
                        {emp.status === "ACTIVE" ? (
                          <UserX className="h-4 w-4 text-rose-600" />
                        ) : (
                          <UserCheck className="h-4 w-4 text-emerald-600" />
                        )}
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
