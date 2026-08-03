import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { getEmployeeList, getEmployeeStats } from "@/actions/finance/employees"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Users, Wallet } from "lucide-react"
import { EmployeeTable } from "@/components/finance/employees/EmployeeTable"
import { formatCurrency } from "@/lib/utils"

export default async function FinanceEmployeesPage() {
  const session = await auth()
  const allowedRoles = ["ADMIN", "FINANCE_MANAGER"]

  if (!session?.user?.role || !allowedRoles.includes(session.user.role as string)) {
    redirect("/dashboard")
  }

  const [employees, stats] = await Promise.all([
    getEmployeeList(undefined, true),
    getEmployeeStats(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-sm text-muted-foreground">
            Manage staff records used for salary payroll and employee-linked expenses.
          </p>
        </div>
        <Link href="/dashboard/finance/employees/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
            <Users className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">{stats.inactive} inactive</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Basic Payroll</CardTitle>
            <Wallet className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {formatCurrency(stats.totalBasicPayroll)}
            </div>
            <p className="text-xs text-muted-foreground">Sum of active basic salaries</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Basic</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {formatCurrency(stats.averageBasicSalary)}
            </div>
            <p className="text-xs text-muted-foreground">Per active employee</p>
          </CardContent>
        </Card>
      </div>

      <EmployeeTable employees={employees} />
    </div>
  )
}
