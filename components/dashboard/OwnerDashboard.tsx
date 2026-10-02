import Link from "next/link"
import {
  ArrowRight,
  Banknote,
  Boxes,
  ClipboardCheck,
  DollarSign,
  Package,
  Plus,
  ShoppingCart,
  Truck,
  Users,
  Warehouse,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export type DashboardOverview = Awaited<
  ReturnType<typeof import("@/actions/dashboard").getDashboardOverview>
>

type OwnerDashboardProps = {
  data: DashboardOverview
  ownerName: string
}

const quickActions = [
  {
    label: "New Purchase",
    href: "/dashboard/purchases",
    icon: ShoppingCart,
    className:
      "border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-400 hover:bg-amber-100",
  },
  {
    label: "New Sale",
    href: "/dashboard/sales",
    icon: DollarSign,
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-400 hover:bg-emerald-100",
  },
  {
    label: "New Production",
    href: "/dashboard/production",
    icon: Boxes,
    className: "border-blue-200 bg-blue-50 text-blue-800 hover:border-blue-400 hover:bg-blue-100",
  },
  {
    label: "New Dispatch",
    href: "/dashboard/dispatch",
    icon: Truck,
    className:
      "border-violet-200 bg-violet-50 text-violet-800 hover:border-violet-400 hover:bg-violet-100",
  },
  {
    label: "Add Customer",
    href: "/dashboard/customers",
    icon: Plus,
    className: "border-cyan-200 bg-cyan-50 text-cyan-800 hover:border-cyan-400 hover:bg-cyan-100",
  },
  {
    label: "Add Supplier",
    href: "/dashboard/suppliers",
    icon: Plus,
    className:
      "border-orange-200 bg-orange-50 text-orange-800 hover:border-orange-400 hover:bg-orange-100",
  },
  {
    label: "Add Expense",
    href: "/dashboard/finance/expenses/new",
    icon: Plus,
    className: "border-rose-200 bg-rose-50 text-rose-800 hover:border-rose-400 hover:bg-rose-100",
  },
]

export function OwnerDashboard({ data, ownerName }: OwnerDashboardProps) {
  const maxChartValue = Math.max(
    ...data.sevenDaySeries.flatMap((item) => [item.sales, item.purchases]),
    1,
  )
  const currency = (value: number) =>
    `PKR ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
  const quantity = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 2 })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Welcome back, {ownerName}. Here is today&apos;s mill activity.
          </p>
        </div>
        <Badge variant="secondary" className="w-fit">
          Live operational overview
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {quickActions.map(({ label, href, icon: Icon, className }) => (
          <Link
            key={label}
            href={href}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium shadow-sm transition ${className}`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Today's Sales"
          value={currency(data.metrics.todaySales)}
          icon={DollarSign}
          detail="Invoice total"
        />
        <MetricCard
          title="Today's Purchases"
          value={currency(data.metrics.todayPurchases)}
          icon={ShoppingCart}
          detail="Received today"
        />
        <MetricCard
          title="Today's Production"
          value={`${quantity(data.metrics.todayProduction)} KG`}
          icon={Boxes}
          detail="Output recorded"
        />
        <MetricCard
          title="Current Stock Value"
          value={currency(data.metrics.stockValue)}
          icon={Package}
          detail={`${quantity(data.metrics.stockQuantity)} units in stock`}
        />
        <MetricCard
          title="Customer Receivables"
          value={currency(data.metrics.customerReceivable)}
          icon={DollarSign}
          detail="Outstanding sales payments"
        />
        <MetricCard
          title="Supplier Payables"
          value={currency(data.metrics.supplierPayable)}
          icon={Truck}
          detail="Outstanding purchase balance"
        />
        <MetricCard
          title="Today's Expenses"
          value={currency(data.metrics.todayExpenses)}
          icon={Warehouse}
          detail="Recorded expenses"
        />
        <MetricCard
          title="Today's Profit"
          value={currency(data.metrics.todayProfit)}
          icon={data.metrics.todayProfit >= 0 ? ArrowRight : ArrowRight}
          detail={`Month expenses ${currency(data.metrics.monthExpenses)}`}
        />
        {data.payroll && (
          <MetricCard
            title="Monthly Payroll"
            value={currency(data.payroll.monthlyPayrollTotal)}
            icon={Banknote}
            detail={`${data.payroll.activeEmployeeCount} active employee${data.payroll.activeEmployeeCount === 1 ? "" : "s"}`}
          />
        )}
        {data.payroll && (
          <MetricCard
            title="Salary Payments Pending"
            value={currency(data.payroll.pendingThisMonth)}
            icon={Users}
            detail={`${data.payroll.pendingCount} pending this month`}
          />
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <CardHeader>
            <CardTitle>Sales vs Purchases (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-56 gap-3 border-b border-l bg-slate-50 px-4 pt-6 pb-2">
              {data.sevenDaySeries.map((item) => (
                <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex w-full flex-1 items-end justify-center gap-1">
                    <div
                      className="w-1/3 rounded-t bg-emerald-500"
                      style={{ height: `${Math.max((item.sales / maxChartValue) * 100, 2)}%` }}
                      title={`Sales: ${currency(item.sales)}`}
                    />
                    <div
                      className="w-1/3 rounded-t bg-amber-400"
                      style={{ height: `${Math.max((item.purchases / maxChartValue) * 100, 2)}%` }}
                      title={`Purchases: ${currency(item.purchases)}`}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 flex gap-4 text-xs text-muted-foreground">
              <span>
                <i className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />
                Sales
              </span>
              <span>
                <i className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-400" />
                Purchases
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pending Dispatches</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.pendingDispatches.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No pending dispatches.
              </p>
            ) : (
              data.pendingDispatches.map((dispatch) => (
                <div
                  key={dispatch.dispatchNo}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div>
                    <p className="font-medium">{dispatch.dispatchNo}</p>
                    <p className="text-xs text-muted-foreground">
                      {dispatch.customer} · {dispatch.date}
                    </p>
                  </div>
                  <Badge variant="outline">{dispatch.status}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DashboardTable
          title="Stock Summary"
          icon={Package}
          action="View stock"
          href="/dashboard/stock"
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 font-medium">Product</th>
                <th className="pb-2 font-medium">Current Stock</th>
                <th className="pb-2 font-medium">Value</th>
                <th className="pb-2 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.stockSummary.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground">
                    No stock received yet.
                  </td>
                </tr>
              ) : (
                data.stockSummary.map((item) => (
                  <tr key={item.productId} className="border-b last:border-0">
                    <td className="py-3 font-medium">{item.name}</td>
                    <td className="py-3">
                      {quantity(item.quantity)} {item.unit}
                    </td>
                    <td className="py-3">{currency(item.value)}</td>
                    <td className="py-3 text-right">
                      <span className={item.quantity > 0 ? "text-emerald-700" : "text-red-600"}>
                        {item.quantity > 0 ? "In Stock" : "Low Stock"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </DashboardTable>
        <DashboardTable
          title="Recent Production Batches"
          icon={ClipboardCheck}
          action="View production"
          href="/dashboard/production"
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 font-medium">Batch No.</th>
                <th className="pb-2 font-medium">Output Godown</th>
                <th className="pb-2 font-medium">Output</th>
                <th className="pb-2 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recentProduction.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground">
                    No production batches yet.
                  </td>
                </tr>
              ) : (
                data.recentProduction.map((item) => (
                  <tr key={item.batchNo} className="border-b last:border-0">
                    <td className="py-3 font-medium">{item.batchNo}</td>
                    <td className="py-3">{item.godown}</td>
                    <td className="py-3">{quantity(item.output)} KG</td>
                    <td className="py-3 text-right">
                      <Badge
                        variant={
                          item.status === "Completed"
                            ? "secondary"
                            : item.status === "Cancelled"
                              ? "destructive"
                              : "outline"
                        }
                      >
                        {item.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </DashboardTable>
      </div>

      {data.payroll && (
        <DashboardTable
          title="Payroll Status"
          icon={Banknote}
          action="Manage salaries"
          href="/dashboard/finance/salaries"
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 font-medium">Employee</th>
                <th className="pb-2 text-right font-medium">This Month</th>
              </tr>
            </thead>
            <tbody>
              {data.payroll.employeeStatus.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-8 text-center text-muted-foreground">
                    No active employees yet.
                  </td>
                </tr>
              ) : (
                data.payroll.employeeStatus.map((employee) => (
                  <tr key={employee.id} className="border-b last:border-0">
                    <td className="py-3 font-medium">{employee.name}</td>
                    <td className="py-3 text-right">
                      <Badge
                        variant={
                          employee.status === "PAID"
                            ? "secondary"
                            : employee.status === "PENDING"
                              ? "outline"
                              : "destructive"
                        }
                      >
                        {employee.status === "NOT_RECORDED" ? "Not Recorded" : employee.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </DashboardTable>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Purchases</CardTitle>
            <Link
              href="/dashboard/purchases"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            {data.recentPurchases.length === 0 ? (
              <p className="py-6 text-sm text-muted-foreground">No purchases recorded yet.</p>
            ) : (
              data.recentPurchases.map((purchase) => (
                <div key={purchase.purchaseNo} className="rounded-lg border p-3">
                  <p className="font-medium">{purchase.purchaseNo}</p>
                  <p className="text-xs text-muted-foreground">
                    {purchase.supplier} · {purchase.date}
                  </p>
                  <p className="mt-2 text-sm font-semibold">{currency(purchase.total)}</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
}: {
  title: string
  value: string
  detail: string
  icon: typeof DollarSign
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between pt-5">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-xl font-bold">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
        </div>
        <Icon className="h-5 w-5 text-emerald-600" />
      </CardContent>
    </Card>
  )
}

function DashboardTable({
  title,
  icon: Icon,
  action,
  href,
  children,
}: {
  title: string
  icon: typeof Package
  action: string
  href: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-emerald-600" />
            {title}
          </CardTitle>
          <Link href={href} className={buttonVariants({ variant: "ghost", size: "sm" })}>
            {action}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
