import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { getBudgetVsActual } from "@/actions/finance/budgets"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Wallet } from "lucide-react"
import { BudgetTable } from "@/components/finance/budgets/BudgetTable"
import { formatCurrency } from "@/lib/utils"
import { getCurrentMonthYear, MONTHS } from "@/lib/finance"

export default async function FinanceBudgetsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  const session = await auth()
  const allowedRoles = ["ADMIN", "FINANCE_MANAGER"]

  if (!session?.user?.role || !allowedRoles.includes(session.user.role as string)) {
    redirect("/dashboard")
  }

  const params = await searchParams
  const current = getCurrentMonthYear()
  const month = params.month && MONTHS.includes(params.month as (typeof MONTHS)[number])
    ? params.month
    : current.month
  const year = params.year ? Number(params.year) : current.year

  const [budgetData] = await Promise.all([
    getBudgetVsActual(month, year),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budget Management</h1>
          <p className="text-sm text-muted-foreground">
            Set monthly limits and track overspending for {month} {year}.
          </p>
        </div>
        <Link href="/dashboard/finance/budgets/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Budget
          </Button>
        </Link>
      </div>

      <form className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-muted-foreground">Month</label>
          <select
            name="month"
            defaultValue={month}
            className="mt-1 flex h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          >
            {MONTHS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Year</label>
          <input
            type="number"
            name="year"
            defaultValue={year}
            className="mt-1 flex h-9 w-28 rounded-md border border-input bg-transparent px-3 text-sm"
          />
        </div>
        <Button type="submit" variant="outline">
          Apply
        </Button>
      </form>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <Wallet className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {formatCurrency(budgetData.totals.totalBudget)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {formatCurrency(budgetData.totals.totalSpent)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-semibold ${
                budgetData.totals.utilizationPercent > 100 ? "text-rose-600" : "text-emerald-600"
              }`}
            >
              {budgetData.totals.utilizationPercent}%
            </div>
          </CardContent>
        </Card>
      </div>

      <BudgetTable rows={budgetData.rows} />
    </div>
  )
}
