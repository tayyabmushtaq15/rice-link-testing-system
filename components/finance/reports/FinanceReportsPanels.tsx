"use client"

import { downloadCsv, formatCurrency } from "@/lib/utils"
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
import { Download } from "lucide-react"
import { PostLotToFinanceButton } from "@/components/finance/PostLotToFinanceButton"

type ReportsBundle = Awaited<
  ReturnType<typeof import("@/actions/finance/reports").getFinanceReportsBundle>
>

interface FinanceReportsPanelsProps {
  data: ReportsBundle
  month: string
  year: number
}

export function FinanceReportsPanels({ data, month, year }: FinanceReportsPanelsProps) {
  const { pnl, salary, budget, lots } = data

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Monthly P&amp;L</CardTitle>
            <p className="text-sm text-muted-foreground">
              {month} {year} — Income vs Expenses
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadCsv(`pnl-${month}-${year}.csv`, [
                ...pnl.incomes.map((i) => ({
                  type: "Income",
                  date: new Date(i.date).toISOString().slice(0, 10),
                  ref: i.transactionNo,
                  detail: i.source,
                  amount: i.amount,
                })),
                ...pnl.expenses.map((e) => ({
                  type: "Expense",
                  date: new Date(e.date).toISOString().slice(0, 10),
                  ref: e.transactionNo,
                  detail: e.categoryName,
                  amount: e.amount,
                })),
              ])
            }
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Income</p>
              <p className="text-xl font-semibold text-emerald-600">
                {formatCurrency(pnl.totalIncome)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expenses</p>
              <p className="text-xl font-semibold text-rose-600">
                {formatCurrency(pnl.totalExpenses)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Net</p>
              <p
                className={`text-xl font-semibold ${
                  pnl.netProfit >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {formatCurrency(pnl.netProfit)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Budget vs Actual</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadCsv(
                `budget-${month}-${year}.csv`,
                budget.rows.map((r) => ({
                  category: r.categoryName,
                  budget: r.budgetAmount,
                  spent: r.spent,
                  remaining: r.remaining,
                  utilizationPercent: r.utilizationPercent,
                }))
              )
            }
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          {budget.rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No budgets set for this period.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Budget</TableHead>
                  <TableHead className="text-right">Spent</TableHead>
                  <TableHead className="text-right">Remaining</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budget.rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.categoryName}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.budgetAmount)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.spent)}</TableCell>
                    <TableCell
                      className={`text-right ${row.isOverspent ? "text-rose-600" : ""}`}
                    >
                      {formatCurrency(row.remaining)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Salary Summary</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadCsv(
                `salaries-${month}-${year}.csv`,
                salary.salaries.map((s) => ({
                  employee: s.employeeName,
                  department: s.department,
                  month: s.month,
                  year: s.year,
                  netSalary: s.netSalary,
                  status: s.paymentStatus,
                }))
              )
            }
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Total Net</p>
              <p className="text-xl font-semibold">{formatCurrency(salary.totals.totalNet)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Paid</p>
              <p className="text-xl font-semibold text-emerald-600">
                {formatCurrency(salary.totals.paidAmount)} ({salary.totals.paidCount})
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-xl font-semibold text-amber-600">
                {formatCurrency(salary.totals.pendingAmount)} ({salary.totals.pendingCount})
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Lot Profitability</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadCsv(
                `lot-profitability.csv`,
                lots.map((l) => ({
                  lotNumber: l.lotNumber,
                  mill: l.millName,
                  supplier: l.supplierName,
                  paddyCost: l.paddyCost,
                  processingCost: l.processingCost,
                  expectedSale: l.expectedSaleValue,
                  grossProfit: l.grossProfit,
                  marginPercent: l.profitMarginPercent,
                  posted: l.postedToFinance ? "Yes" : "No",
                }))
              )
            }
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          {lots.length === 0 ? (
            <p className="text-sm text-muted-foreground">No lots with production output yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lot</TableHead>
                    <TableHead>Mill</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Sale Value</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                    <TableHead>Finance</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lots.map((lot) => (
                    <TableRow key={lot.lotId}>
                      <TableCell className="font-medium">{lot.lotNumber}</TableCell>
                      <TableCell>{lot.millName}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(lot.totalLotCost)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(lot.expectedSaleValue)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          lot.grossProfit >= 0 ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {formatCurrency(lot.grossProfit)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={lot.postedToFinance ? "default" : "secondary"}>
                          {lot.postedToFinance ? "Posted" : "Unposted"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {!lot.postedToFinance && (
                          <PostLotToFinanceButton paddyLotId={lot.lotId} />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
