"use client"

import Link from "next/link"
import { Download } from "lucide-react"
import { downloadCsv, formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SortableTableHead } from "@/components/ui/SortableTableHead"
import { Pagination } from "@/components/ui/Pagination"
import type {
  getBalanceSheet,
  getGeneralLedger,
  getProfitAndLoss,
  getTrialBalance,
} from "@/actions/finance/ledger"

type GeneralLedger = Awaited<ReturnType<typeof getGeneralLedger>>
type TrialBalance = Awaited<ReturnType<typeof getTrialBalance>>
type ProfitAndLoss = Awaited<ReturnType<typeof getProfitAndLoss>>
type BalanceSheet = Awaited<ReturnType<typeof getBalanceSheet>>

function referenceHref(sourceType: string, sourceId: string) {
  if (sourceType === "PURCHASE" || sourceType === "PURCHASE_PAYMENT")
    return `/dashboard/purchases/${sourceId}`
  if (sourceType === "SALE" || sourceType === "SALE_PAYMENT") return `/dashboard/sales/${sourceId}`
  if (sourceType === "EXPENSE") return `/dashboard/finance/expenses/${sourceId}/edit`
  if (sourceType === "INCOME") return `/dashboard/finance/income/${sourceId}/edit`
  return null
}

function GeneralLedgerTable({
  data,
  basePath,
  searchParams,
}: {
  data: GeneralLedger
  basePath: string
  searchParams: Record<string, string | string[] | undefined>
}) {
  const rows = data.items
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>General Ledger</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            downloadCsv(
              "general-ledger.csv",
              rows.map((row) => ({
                date: new Date(row.date).toISOString().slice(0, 10),
                account: `${row.accountCode} - ${row.accountName}`,
                description: row.description,
                debit: row.debit,
                credit: row.credit,
                reference: `${row.sourceType}:${row.sourceId}`,
              })),
            )
          }
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No journal entries match this filter.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead
                    label="Date"
                    sortKey="date"
                    currentSort={data.sort}
                    currentDir={data.dir}
                    basePath={basePath}
                    searchParams={searchParams}
                  />
                  <TableHead>Account</TableHead>
                  <SortableTableHead
                    label="Description"
                    sortKey="description"
                    currentSort={data.sort}
                    currentDir={data.dir}
                    basePath={basePath}
                    searchParams={searchParams}
                  />
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const href = referenceHref(row.sourceType, row.sourceId)
                  return (
                    <TableRow key={row.id}>
                      <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {row.accountCode} - {row.accountName}
                      </TableCell>
                      <TableCell>{row.description}</TableCell>
                      <TableCell className="text-right">
                        {row.debit > 0 ? formatCurrency(row.debit) : ""}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.credit > 0 ? formatCurrency(row.credit) : ""}
                      </TableCell>
                      <TableCell>
                        {href ? (
                          <Link href={href} className="text-emerald-700 hover:underline">
                            {row.sourceType}
                          </Link>
                        ) : (
                          row.sourceType
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
        <Pagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          totalPages={data.totalPages}
          basePath={basePath}
          searchParams={searchParams}
        />
      </CardContent>
    </Card>
  )
}

function TrialBalanceTable({ data }: { data: TrialBalance }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Trial Balance</CardTitle>
          <p className="text-sm text-muted-foreground">All-time, every account with activity.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            downloadCsv(
              "trial-balance.csv",
              data.rows.map((row) => ({
                code: row.code,
                account: row.name,
                type: row.type,
                debit: row.debit,
                credit: row.credit,
              })),
            )
          }
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Debit</TableHead>
              <TableHead className="text-right">Credit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.rows.map((row) => (
              <TableRow key={row.accountId}>
                <TableCell>{row.code}</TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.type}</TableCell>
                <TableCell className="text-right">{formatCurrency(row.debit)}</TableCell>
                <TableCell className="text-right">{formatCurrency(row.credit)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="font-semibold">
              <TableCell colSpan={3}>Total</TableCell>
              <TableCell className="text-right">{formatCurrency(data.totalDebit)}</TableCell>
              <TableCell className="text-right">{formatCurrency(data.totalCredit)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <div className="mt-4">
          <Badge variant={data.balanced ? "default" : "destructive"}>
            {data.balanced ? "✓ Books are balanced" : "✗ Books are NOT balanced"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

function ProfitAndLossPanel({ data }: { data: ProfitAndLoss }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Profit &amp; Loss</CardTitle>
          <p className="text-sm text-muted-foreground">
            {new Date(data.dateFrom).toLocaleDateString()} to {new Date(data.dateTo).toLocaleDateString()}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            downloadCsv("profit-and-loss.csv", [
              ...data.salesByAccount.map((item) => ({ type: "Sales", account: item.name, amount: item.amount })),
              { type: "Total Sales", account: "", amount: data.totalSales },
              { type: "COGS", account: "Cost of Goods Sold", amount: data.cogs },
              { type: "Gross Profit", account: "", amount: data.grossProfit },
              { type: "Other Income", account: "", amount: data.otherIncome },
              ...data.expensesByAccount.map((item) => ({ type: "Expense", account: item.name, amount: item.amount })),
              { type: "Total Expenses", account: "", amount: data.totalExpenses },
              { type: "Net Profit", account: "", amount: data.netProfit },
            ])
          }
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Sales</p>
            <p className="text-xl font-semibold">{formatCurrency(data.totalSales)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Gross Profit</p>
            <p className="text-xl font-semibold text-emerald-600">{formatCurrency(data.grossProfit)}</p>
            <p className="text-xs text-muted-foreground">{data.grossMarginPercent.toFixed(1)}% margin</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="text-xl font-semibold text-rose-600">{formatCurrency(data.totalExpenses)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Net Profit</p>
            <p
              className={`text-xl font-semibold ${data.netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}
            >
              {formatCurrency(data.netProfit)}
            </p>
            <p className="text-xs text-muted-foreground">{data.netMarginPercent.toFixed(1)}% margin</p>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold">Sales</h3>
          <Table>
            <TableBody>
              {data.salesByAccount.map((item) => (
                <TableRow key={item.code}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell>Cost of Goods Sold</TableCell>
                <TableCell className="text-right text-rose-600">
                  ({formatCurrency(data.cogs)})
                </TableCell>
              </TableRow>
              {data.otherIncome !== 0 && (
                <TableRow>
                  <TableCell>Other Income</TableCell>
                  <TableCell className="text-right">{formatCurrency(data.otherIncome)}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold">Expenses</h3>
          {data.expensesByAccount.length === 0 ? (
            <p className="text-sm text-muted-foreground">No expenses in this period.</p>
          ) : (
            <Table>
              <TableBody>
                {data.expensesByAccount.map((item) => (
                  <TableRow key={item.code}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function BalanceSheetPanel({ data }: { data: BalanceSheet }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Balance Sheet</CardTitle>
          <p className="text-sm text-muted-foreground">
            As of {new Date(data.asOfDate).toLocaleDateString()}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            downloadCsv("balance-sheet.csv", [
              ...data.assets.map((item) => ({ section: "Asset", account: item.name, balance: item.balance })),
              ...data.liabilities.map((item) => ({ section: "Liability", account: item.name, balance: item.balance })),
              ...data.equity.map((item) => ({ section: "Equity", account: item.name, balance: item.balance })),
              { section: "Equity", account: "Retained Earnings", balance: data.retainedEarnings },
            ])
          }
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-semibold">Assets</h3>
            <Table>
              <TableBody>
                {data.assets.map((item) => (
                  <TableRow key={item.code}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.balance)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-semibold">
                  <TableCell>Total Assets</TableCell>
                  <TableCell className="text-right">{formatCurrency(data.totalAssets)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 text-sm font-semibold">Liabilities</h3>
              <Table>
                <TableBody>
                  {data.liabilities.map((item) => (
                    <TableRow key={item.code}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.balance)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-semibold">
                    <TableCell>Total Liabilities</TableCell>
                    <TableCell className="text-right">{formatCurrency(data.totalLiabilities)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold">Equity</h3>
              <Table>
                <TableBody>
                  {data.equity.map((item) => (
                    <TableRow key={item.code}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.balance)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell>Retained Earnings</TableCell>
                    <TableCell className="text-right">{formatCurrency(data.retainedEarnings)}</TableCell>
                  </TableRow>
                  <TableRow className="font-semibold">
                    <TableCell>Total Equity</TableCell>
                    <TableCell className="text-right">{formatCurrency(data.totalEquity)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
        <Badge variant={data.balanced ? "default" : "destructive"}>
          {data.balanced ? "✓ Assets = Liabilities + Equity" : "✗ Balance sheet does NOT balance"}
        </Badge>
      </CardContent>
    </Card>
  )
}

export function LedgerPanels({
  view,
  generalLedger,
  trialBalance,
  profitAndLoss,
  balanceSheet,
  basePath,
  searchParams,
}: {
  view: string
  generalLedger?: GeneralLedger
  trialBalance?: TrialBalance
  profitAndLoss?: ProfitAndLoss
  balanceSheet?: BalanceSheet
  basePath: string
  searchParams: Record<string, string | string[] | undefined>
}) {
  if (view === "ledger" && generalLedger)
    return <GeneralLedgerTable data={generalLedger} basePath={basePath} searchParams={searchParams} />
  if (view === "trial-balance" && trialBalance) return <TrialBalanceTable data={trialBalance} />
  if (view === "pl" && profitAndLoss) return <ProfitAndLossPanel data={profitAndLoss} />
  if (view === "balance-sheet" && balanceSheet) return <BalanceSheetPanel data={balanceSheet} />
  return null
}
