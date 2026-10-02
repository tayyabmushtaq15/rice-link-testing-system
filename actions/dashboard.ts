"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { calculateProductStockBalances } from "@/lib/stock"

function startOfDay(date: Date) {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)
  return value
}

function endOfDay(date: Date) {
  const value = new Date(date)
  value.setHours(23, 59, 59, 999)
  return value
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export async function getDashboardOverview() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const canFinance = session.user.role === "ADMIN" || session.user.role === "FINANCE_MANAGER"

  const now = new Date()
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)
  const monthStart = startOfMonth(now)
  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - 6)

  const [
    todayPurchases,
    todaySales,
    todayExpenses,
    todayProductionBatches,
    stockMovements,
    recentProductionBatches,
    recentPurchases,
    pendingDispatches,
    purchaseSeries,
    saleSeries,
    monthExpenses,
    outstandingSales,
    outstandingPurchases,
  ] = await Promise.all([
    prisma.purchase.findMany({
      where: { purchaseDate: { gte: todayStart, lte: todayEnd } },
      select: { totalAmount: true },
    }),
    prisma.sale.findMany({
      where: { invoiceDate: { gte: todayStart, lte: todayEnd } },
      select: { totalAmount: true },
    }),
    prisma.expense.findMany({
      where: { isDeleted: false, date: { gte: todayStart, lte: todayEnd } },
      select: { amount: true },
    }),
    prisma.productionBatch.findMany({
      where: { productionDate: { gte: todayStart, lte: todayEnd } },
      select: { totalOutput: true },
    }),
    prisma.stockMovement.findMany({
      include: { product: { include: { unit: true } } },
    }),
    prisma.productionBatch.findMany({
      include: { outputGodown: true },
      orderBy: { productionDate: "desc" },
      take: 6,
    }),
    prisma.purchase.findMany({
      include: { supplier: true },
      orderBy: { purchaseDate: "desc" },
      take: 5,
    }),
    prisma.dispatch.findMany({
      where: { status: { notIn: ["DELIVERED", "CANCELLED"] } },
      include: { sale: { include: { customer: true } } },
      orderBy: { dispatchDate: "asc" },
      take: 5,
    }),
    prisma.purchase.findMany({
      where: { purchaseDate: { gte: weekStart, lte: todayEnd } },
      select: { purchaseDate: true, totalAmount: true },
    }),
    prisma.sale.findMany({
      where: { invoiceDate: { gte: weekStart, lte: todayEnd } },
      select: { invoiceDate: true, totalAmount: true },
    }),
    prisma.expense.findMany({
      where: { isDeleted: false, date: { gte: monthStart, lte: todayEnd } },
      select: { amount: true },
    }),
    prisma.sale.findMany({
      select: { totalAmount: true, receivedAmount: true },
    }),
    prisma.purchase.findMany({
      select: { totalAmount: true, paidAmount: true },
    }),
  ])

  const stockBalances = calculateProductStockBalances(stockMovements)
  const totalStock = stockBalances.reduce((sum, entry) => sum + entry.quantity, 0)
  const stockValue = stockBalances.reduce((sum, entry) => sum + entry.value, 0)

  const customerReceivable = outstandingSales.reduce(
    (sum, sale) => sum + Math.max(Number(sale.totalAmount) - Number(sale.receivedAmount), 0),
    0,
  )
  const supplierPayable = outstandingPurchases.reduce(
    (sum, purchase) =>
      sum + Math.max(Number(purchase.totalAmount) - Number(purchase.paidAmount), 0),
    0,
  )

  const todaySalesTotal = todaySales.reduce((sum, item) => sum + Number(item.totalAmount), 0)
  const todayPurchasesTotal = todayPurchases.reduce(
    (sum, item) => sum + Number(item.totalAmount),
    0,
  )
  const todayExpensesTotal = todayExpenses.reduce((sum, item) => sum + item.amount, 0)
  const todayProductionTotal = todayProductionBatches.reduce(
    (sum, batch) => sum + Number(batch.totalOutput),
    0,
  )

  type PayrollOverview = {
    activeEmployeeCount: number
    monthlyPayrollTotal: number
    paidThisMonth: number
    pendingThisMonth: number
    pendingCount: number
    employeeStatus: Array<{
      id: string
      name: string
      status: "PAID" | "PENDING" | "NOT_RECORDED"
    }>
  }

  let payroll: PayrollOverview | undefined

  if (canFinance) {
    const currentMonthStr = String(now.getMonth() + 1).padStart(2, "0")
    const currentYear = now.getFullYear()

    const [activeEmployees, currentMonthSalaries] = await Promise.all([
      prisma.employee.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, name: true, basicSalary: true },
        orderBy: { name: "asc" },
      }),
      prisma.salary.findMany({
        where: { month: currentMonthStr, year: currentYear },
        select: { employeeId: true, paymentStatus: true, netSalary: true },
      }),
    ])

    const salaryByEmployee = new Map(currentMonthSalaries.map((s) => [s.employeeId, s]))
    const pendingRecords = currentMonthSalaries.filter((s) => s.paymentStatus === "PENDING")

    payroll = {
      activeEmployeeCount: activeEmployees.length,
      monthlyPayrollTotal: activeEmployees.reduce((sum, e) => sum + e.basicSalary, 0),
      paidThisMonth: currentMonthSalaries
        .filter((s) => s.paymentStatus === "PAID")
        .reduce((sum, s) => sum + s.netSalary, 0),
      pendingThisMonth: pendingRecords.reduce((sum, s) => sum + s.netSalary, 0),
      pendingCount: pendingRecords.length,
      employeeStatus: activeEmployees.map((employee) => {
        const record = salaryByEmployee.get(employee.id)
        return {
          id: employee.id,
          name: employee.name,
          status: !record ? "NOT_RECORDED" : record.paymentStatus === "PAID" ? "PAID" : "PENDING",
        }
      }),
    }
  }

  const sevenDaySeries = Array.from({ length: 7 }, (_, index) => {
    const dayStart = new Date(weekStart)
    dayStart.setDate(weekStart.getDate() + index)
    const dayEnd = endOfDay(dayStart)
    const purchases = purchaseSeries
      .filter((item) => item.purchaseDate >= dayStart && item.purchaseDate <= dayEnd)
      .reduce((sum, item) => sum + Number(item.totalAmount), 0)
    const sales = saleSeries
      .filter((item) => item.invoiceDate >= dayStart && item.invoiceDate <= dayEnd)
      .reduce((sum, item) => sum + Number(item.totalAmount), 0)
    return { label: dayStart.toLocaleDateString("en-US", { weekday: "short" }), purchases, sales }
  })

  return {
    metrics: {
      todaySales: todaySalesTotal,
      todayPurchases: todayPurchasesTotal,
      todayProduction: todayProductionTotal,
      stockValue,
      stockQuantity: totalStock,
      todayExpenses: todayExpensesTotal,
      todayProfit: todaySalesTotal - todayPurchasesTotal - todayExpensesTotal,
      monthExpenses: monthExpenses.reduce((sum, item) => sum + item.amount, 0),
      pendingDispatches: pendingDispatches.length,
      customerReceivable,
      supplierPayable,
    },
    sevenDaySeries,
    stockSummary: stockBalances.sort((a, b) => b.quantity - a.quantity).slice(0, 8),
    recentProduction: recentProductionBatches.map((batch) => ({
      batchNo: batch.batchNo,
      godown: batch.outputGodown.name,
      status: batch.status.charAt(0) + batch.status.slice(1).toLowerCase().replace("_", " "),
      output: Number(batch.totalOutput),
    })),
    recentPurchases: recentPurchases.map((purchase) => ({
      purchaseNo: purchase.purchaseNo,
      supplier: purchase.supplier.name,
      total: Number(purchase.totalAmount),
      date: purchase.purchaseDate.toLocaleDateString(),
    })),
    pendingDispatches: pendingDispatches.map((dispatch) => ({
      dispatchNo: dispatch.dispatchNo,
      customer: dispatch.sale.customer.name,
      date: dispatch.dispatchDate.toLocaleDateString(),
      status: dispatch.status,
    })),
    payroll,
  }
}
