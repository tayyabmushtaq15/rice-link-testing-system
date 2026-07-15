import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { getExpenseList, getExpenseStats, getExpensesByCategory } from "@/actions/finance/expenses"
import { getAllCategories } from "@/actions/finance/categories"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, TrendingDown, DollarSign } from "lucide-react"
import { ExpenseTable } from "@/components/finance/expenses/ExpenseTable"
import { formatCurrency } from "@/lib/utils"

export default async function FinanceExpensesPage({
  searchParams,
}: {
  searchParams: { search?: string; category?: string }
}) {
  const session = await auth()
  const allowedRoles = ["ADMIN", "FINANCE_MANAGER"]

  if (!session?.user?.role || !allowedRoles.includes(session.user.role as string)) {
    redirect("/dashboard")
  }

  // Fetch expense data
  const { expenses: expenseList } = await getExpenseList(
    searchParams.search,
    searchParams.category
  )
  const stats = await getExpenseStats()
  const categories = await getAllCategories(false)
  const expensesByCategory = await getExpensesByCategory()

  const topCategory = expensesByCategory
    .map(cat => ({
      name: cat.name,
      amount: cat.expenses.reduce((sum, exp) => sum + exp.amount, 0),
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 1)
    .pop()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expense Management</h1>
          <p className="text-sm text-muted-foreground">Record and track all business expenses by category.</p>
        </div>
        <Link href="/dashboard/finance/expenses/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="mr-2 h-4 w-4" />
            Record Expense
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatCurrency(stats.totalExpenses)}</div>
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
            <p className="text-xs text-muted-foreground">Total transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Expense</CardTitle>
            <TrendingDown className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {formatCurrency(stats.count > 0 ? stats.totalExpenses / stats.count : 0)}
            </div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Top Category</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{topCategory?.name || "N/A"}</div>
            <p className="text-xs text-muted-foreground">{topCategory ? formatCurrency(topCategory.amount) : "No data"}</p>
          </CardContent>
        </Card>
      </div>

      <ExpenseTable expenses={expenseList} />
    </div>
  )
}
