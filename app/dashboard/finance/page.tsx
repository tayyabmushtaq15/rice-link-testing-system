import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { getFinanceOverview } from "@/actions/finance/overview"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  WalletCards,
  Factory,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { getCurrentMonthYear, MONTHS } from "@/lib/finance"
import { PostLotToFinanceButton } from "@/components/finance/PostLotToFinanceButton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default async function FinanceDashboardPage({
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
  const month =
    params.month && MONTHS.includes(params.month as (typeof MONTHS)[number])
      ? params.month
      : current.month
  const year = params.year ? Number(params.year) : current.year

  const overview = await getFinanceOverview(month, year)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finance Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of income, expenses, budgets, and lot posting for {month} {year}.
          </p>
        </div>
        <Badge variant="secondary">Dashboard Finance</Badge>
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatCurrency(overview.totalIncome)}</div>
            <p className="text-xs text-muted-foreground">{overview.incomeCount} records</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatCurrency(overview.totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">{overview.expenseCount} records</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Profit / Loss</CardTitle>
            <DollarSign className="h-4 w-4 text-slate-700" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-semibold ${
                overview.netProfit >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {formatCurrency(overview.netProfit)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Budget Utilization</CardTitle>
            <WalletCards className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{overview.budgetUtilization}%</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(overview.budgetSpent)} of {formatCurrency(overview.budgetTotal)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Income</CardTitle>
          </CardHeader>
          <CardContent>
            {overview.recentIncomes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No income this period.</p>
            ) : (
              <ul className="space-y-3">
                {overview.recentIncomes.map((item) => (
                  <li key={item.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{item.source}</p>
                      <p className="text-muted-foreground">{item.transactionNo}</p>
                    </div>
                    <span className="font-semibold text-emerald-600">
                      {formatCurrency(item.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/dashboard/finance/income"
              className="mt-4 inline-block text-sm text-emerald-700 hover:underline"
            >
              View all income
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {overview.recentExpenses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No expenses this period.</p>
            ) : (
              <ul className="space-y-3">
                {overview.recentExpenses.map((item) => (
                  <li key={item.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{item.categoryName}</p>
                      <p className="text-muted-foreground">{item.transactionNo}</p>
                    </div>
                    <span className="font-semibold text-rose-600">
                      {formatCurrency(item.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/dashboard/finance/expenses"
              className="mt-4 inline-block text-sm text-emerald-700 hover:underline"
            >
              View all expenses
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5" />
              Unposted Production Lots
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {overview.postedLotsCount} posted · {overview.unpostedLotsCount} waiting
            </p>
          </div>
          <Link href="/dashboard/finance/reports">
            <Button variant="outline" size="sm">
              Open reports
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {overview.unpostedLots.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              All lots with production output are posted to finance.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lot</TableHead>
                  <TableHead>Mill</TableHead>
                  <TableHead className="text-right">Expected Sale</TableHead>
                  <TableHead className="text-right">Gross Profit</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.unpostedLots.map((lot) => (
                  <TableRow key={lot.id}>
                    <TableCell className="font-medium">{lot.lotNumber}</TableCell>
                    <TableCell>{lot.millName}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(lot.expectedSaleValue)}
                    </TableCell>
                    <TableCell
                      className={`text-right ${
                        lot.grossProfit >= 0 ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {formatCurrency(lot.grossProfit)}
                    </TableCell>
                    <TableCell>
                      <PostLotToFinanceButton paddyLotId={lot.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
