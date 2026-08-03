import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getFinanceReportsBundle } from "@/actions/finance/reports"
import { FinanceReportsPanels } from "@/components/finance/reports/FinanceReportsPanels"
import { Button } from "@/components/ui/button"
import { getCurrentMonthYear, MONTHS } from "@/lib/finance"

export default async function FinanceReportsPage({
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

  const data = await getFinanceReportsBundle(month, year)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Finance Reports</h1>
        <p className="text-sm text-muted-foreground">
          Monthly P&amp;L, salaries, budgets, and lot profitability with CSV export.
        </p>
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

      <FinanceReportsPanels data={data} month={month} year={year} />
    </div>
  )
}
