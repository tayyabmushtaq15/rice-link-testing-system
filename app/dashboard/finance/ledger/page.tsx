import Link from "next/link"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  getBalanceSheet,
  getChartOfAccounts,
  getGeneralLedger,
  getProfitAndLoss,
  getTrialBalance,
} from "@/actions/finance/ledger"
import { LedgerPanels } from "@/components/finance/ledger/LedgerPanels"

const VIEWS = [
  { id: "ledger", label: "General Ledger" },
  { id: "trial-balance", label: "Trial Balance" },
  { id: "pl", label: "Profit & Loss" },
  { id: "balance-sheet", label: "Balance Sheet" },
] as const
type View = (typeof VIEWS)[number]["id"]

// Parsed/formatted using local date parts throughout (not toISOString/`new Date("YYYY-MM-DD")`,
// both of which go through UTC and shift the date by a day in non-UTC timezones) so the "As of"/
// "From"/"To" inputs and the computed ranges always agree on which calendar day was picked.
function toDate(value?: string) {
  if (!value) return undefined
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return undefined
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return Number.isNaN(date.getTime()) ? undefined : date
}

function toDateInput(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function resolveRange(preset: string | undefined, dateFrom?: string, dateTo?: string) {
  if (dateFrom && dateTo) {
    const from = toDate(dateFrom)
    const to = toDate(dateTo)
    if (from && to) return { dateFrom: from, dateTo: new Date(to.getTime() + 86_399_999) }
  }
  const now = new Date()
  if (preset === "today") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    return { dateFrom: start, dateTo: new Date(start.getTime() + 86_399_999) }
  }
  if (preset === "week") {
    const dayOfWeek = now.getDay()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek)
    return { dateFrom: start, dateTo: new Date(start.getTime() + 7 * 86_400_000 - 1) }
  }
  if (preset === "year") {
    return {
      dateFrom: new Date(now.getFullYear(), 0, 1),
      dateTo: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999),
    }
  }
  // default: this month
  return {
    dateFrom: new Date(now.getFullYear(), now.getMonth(), 1),
    dateTo: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
  }
}

export default async function LedgerPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string
    accountId?: string
    dateFrom?: string
    dateTo?: string
    preset?: string
    asOf?: string
    page?: string
    sort?: string
    dir?: string
  }>
}) {
  const session = await auth()
  const allowedRoles = ["ADMIN", "FINANCE_MANAGER"]
  if (!session?.user?.role || !allowedRoles.includes(session.user.role as string)) {
    redirect("/dashboard")
  }

  const params = await searchParams
  const view: View = VIEWS.some((item) => item.id === params.view) ? (params.view as View) : "ledger"

  const accounts = await getChartOfAccounts()

  let generalLedger: Awaited<ReturnType<typeof getGeneralLedger>> | undefined
  let trialBalance: Awaited<ReturnType<typeof getTrialBalance>> | undefined
  let profitAndLoss: Awaited<ReturnType<typeof getProfitAndLoss>> | undefined
  let balanceSheet: Awaited<ReturnType<typeof getBalanceSheet>> | undefined
  const glFilters = { accountId: params.accountId || "", dateFrom: params.dateFrom || "", dateTo: params.dateTo || "" }
  let plFilters = { preset: params.preset || "month", dateFrom: "", dateTo: "" }
  let bsFilters = { preset: params.preset || "today", asOf: "" }

  if (view === "ledger") {
    generalLedger = await getGeneralLedger({
      accountId: params.accountId || undefined,
      dateFrom: toDate(params.dateFrom),
      dateTo: toDate(params.dateTo),
      page: params.page,
      sort: params.sort,
      dir: params.dir,
    })
  } else if (view === "trial-balance") {
    trialBalance = await getTrialBalance()
  } else if (view === "pl") {
    const range = resolveRange(params.preset, params.dateFrom, params.dateTo)
    profitAndLoss = await getProfitAndLoss(range.dateFrom, range.dateTo)
    plFilters = {
      preset: params.preset || "month",
      dateFrom: toDateInput(range.dateFrom),
      dateTo: toDateInput(range.dateTo),
    }
  } else if (view === "balance-sheet") {
    const asOf = toDate(params.asOf) || new Date()
    balanceSheet = await getBalanceSheet(asOf)
    bsFilters = { preset: params.preset || "today", asOf: toDateInput(asOf) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">General Ledger</h1>
        <p className="text-sm text-muted-foreground">
          Double-entry Chart of Accounts fed automatically from Purchases, Sales, and Expenses.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b pb-3">
        {VIEWS.map((item) => (
          <Link
            key={item.id}
            href={`/dashboard/finance/ledger?view=${item.id}`}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              view === item.id
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200",
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {view === "ledger" && (
        <form className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="view" value="ledger" />
          <div>
            <label className="text-xs text-muted-foreground">Account</label>
            <select
              name="accountId"
              defaultValue={glFilters.accountId}
              className="mt-1 flex h-9 min-w-[220px] rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="">All accounts</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.code} - {account.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">From</label>
            <input
              type="date"
              name="dateFrom"
              defaultValue={glFilters.dateFrom}
              className="mt-1 flex h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">To</label>
            <input
              type="date"
              name="dateTo"
              defaultValue={glFilters.dateTo}
              className="mt-1 flex h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            />
          </div>
          <input type="hidden" name="sort" value={generalLedger?.sort || "date"} />
          <input type="hidden" name="dir" value={generalLedger?.dir || "asc"} />
          <button className="h-9 rounded-md bg-slate-900 px-4 text-sm text-white" type="submit">
            Apply
          </button>
        </form>
      )}

      {view === "pl" && (
        <form className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="view" value="pl" />
          <div>
            <label className="text-xs text-muted-foreground">Preset</label>
            <select
              name="preset"
              defaultValue={plFilters.preset}
              className="mt-1 flex h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">From (custom)</label>
            <input
              type="date"
              name="dateFrom"
              defaultValue=""
              className="mt-1 flex h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">To (custom)</label>
            <input
              type="date"
              name="dateTo"
              defaultValue=""
              className="mt-1 flex h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            />
          </div>
          <button className="h-9 rounded-md bg-slate-900 px-4 text-sm text-white" type="submit">
            Apply
          </button>
          <p className="w-full text-xs text-muted-foreground">
            Showing {plFilters.dateFrom} to {plFilters.dateTo}. Custom dates override the preset.
          </p>
        </form>
      )}

      {view === "balance-sheet" && (
        <form className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="view" value="balance-sheet" />
          <div>
            <label className="text-xs text-muted-foreground">As of</label>
            <input
              type="date"
              name="asOf"
              defaultValue={bsFilters.asOf}
              className="mt-1 flex h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            />
          </div>
          <button className="h-9 rounded-md bg-slate-900 px-4 text-sm text-white" type="submit">
            Apply
          </button>
        </form>
      )}

      <LedgerPanels
        view={view}
        generalLedger={generalLedger}
        trialBalance={trialBalance}
        profitAndLoss={profitAndLoss}
        balanceSheet={balanceSheet}
        basePath="/dashboard/finance/ledger"
        searchParams={params}
      />
    </div>
  )
}
