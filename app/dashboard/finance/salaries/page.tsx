import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { getSalaryList, getSalaryStats } from "@/actions/finance/salaries"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, DollarSign } from "lucide-react"
import { SalaryTable } from "@/components/finance/salaries/SalaryTable"
import { formatCurrency } from "@/lib/utils"

export default async function FinanceSalariesPage() {
  const session = await auth()
  const allowedRoles = ["ADMIN", "FINANCE_MANAGER"]

  if (!session?.user?.role || !allowedRoles.includes(session.user.role as string)) {
    redirect("/dashboard")
  }

  const { salaries } = await getSalaryList()
  const stats = await getSalaryStats()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Salary Management</h1>
          <p className="text-sm text-muted-foreground">Record and manage employee payroll.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/finance/employees">
            <Button variant="outline">Manage Employees</Button>
          </Link>
          <Link href="/dashboard/finance/salaries/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Salary Record
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Salaries</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatCurrency(stats.totalSalaries)}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Records Count</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats.count}</div>
            <p className="text-xs text-muted-foreground">Total records</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Salary</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {formatCurrency(stats.count > 0 ? stats.totalSalaries / stats.count : 0)}
            </div>
            <p className="text-xs text-muted-foreground">Per record</p>
          </CardContent>
        </Card>
      </div>

      <SalaryTable salaries={salaries} />
    </div>
  )
}
