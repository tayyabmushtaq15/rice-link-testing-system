"use server"

import { prisma } from "@/lib/prisma"
import { calculateProductionSummary } from "@/lib/production"
import { FINANCE_SOURCE, getMonthDateRange, MONTHS } from "@/lib/finance"
import { checkFinanceAccess } from "./_shared"
import { getBudgetVsActual } from "./budgets"

export async function getMonthlyPnL(month: string, year: number) {
  await checkFinanceAccess()
  const { startDate, endDate } = getMonthDateRange(month, year)

  const [incomeAgg, expenseAgg, incomes, expenses] = await Promise.all([
    prisma.income.aggregate({
      where: { date: { gte: startDate, lte: endDate } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.expense.aggregate({
      where: { isDeleted: false, date: { gte: startDate, lte: endDate } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.income.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      orderBy: { date: "desc" },
      select: {
        id: true,
        transactionNo: true,
        date: true,
        source: true,
        amount: true,
        paymentMethod: true,
      },
    }),
    prisma.expense.findMany({
      where: { isDeleted: false, date: { gte: startDate, lte: endDate } },
      orderBy: { date: "desc" },
      include: { category: { select: { name: true } } },
    }),
  ])

  const totalIncome = incomeAgg._sum.amount || 0
  const totalExpenses = expenseAgg._sum.amount || 0

  return {
    month,
    year,
    totalIncome,
    totalExpenses,
    netProfit: totalIncome - totalExpenses,
    incomeCount: incomeAgg._count,
    expenseCount: expenseAgg._count,
    incomes,
    expenses: expenses.map((e) => ({
      id: e.id,
      transactionNo: e.transactionNo,
      date: e.date,
      categoryName: e.category.name,
      vendorName: e.vendorName,
      amount: e.amount,
      paymentMethod: e.paymentMethod,
    })),
  }
}

export async function getSalaryReport(month?: string, year?: number) {
  await checkFinanceAccess()

  const where: { month?: string; year?: number } = {}
  if (month) {
    const monthIndex = MONTHS.findIndex((m) => m === month)
    where.month =
      monthIndex >= 0 ? String(monthIndex + 1).padStart(2, "0") : month
  }
  if (year) where.year = year

  const salaries = await prisma.salary.findMany({
    where,
    include: { employee: true },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  })

  const totalNet = salaries.reduce((sum, s) => sum + s.netSalary, 0)
  const paid = salaries.filter((s) => s.paymentStatus === "PAID")
  const pending = salaries.filter((s) => s.paymentStatus !== "PAID")

  return {
    salaries: salaries.map((s) => ({
      id: s.id,
      employeeName: s.employee.name,
      department: s.employee.department,
      month: s.month,
      year: s.year,
      basicSalary: s.basicSalary,
      allowances: s.allowances,
      deductions: s.deductions,
      bonus: s.bonus,
      overtime: s.overtime,
      netSalary: s.netSalary,
      paymentStatus: s.paymentStatus,
      paymentDate: s.paymentDate,
    })),
    totals: {
      count: salaries.length,
      totalNet,
      paidCount: paid.length,
      paidAmount: paid.reduce((sum, s) => sum + s.netSalary, 0),
      pendingCount: pending.length,
      pendingAmount: pending.reduce((sum, s) => sum + s.netSalary, 0),
    },
  }
}

export async function getLotProfitabilityReport() {
  await checkFinanceAccess()

  const lots = await prisma.paddyLot.findMany({
    where: { productionOutput: { isNot: null } },
    include: {
      productionOutput: true,
      mill: { select: { name: true } },
      financeIncomes: { select: { sourceType: true } },
      financeExpenses: {
        where: { isDeleted: false },
        select: { sourceType: true },
      },
    },
    orderBy: { purchaseDate: "desc" },
  })

  return lots.map((lot) => {
    const summary = calculateProductionSummary(lot.productionOutput!, lot.purchaseRate)
    const posted =
      lot.financeIncomes.some((i) => i.sourceType === FINANCE_SOURCE.LOT_SALE) ||
      lot.financeExpenses.some(
        (e) =>
          e.sourceType === FINANCE_SOURCE.LOT_PADDY ||
          e.sourceType === FINANCE_SOURCE.LOT_PROCESSING
      )

    return {
      lotId: lot.id,
      lotNumber: lot.lotNumber,
      millName: lot.mill.name,
      supplierName: lot.supplierName,
      variety: lot.variety,
      purchaseDate: lot.purchaseDate,
      paddyCost: summary.paddyCost,
      processingCost: summary.processingCost,
      totalLotCost: summary.totalLotCost,
      expectedSaleValue: summary.expectedSaleValue,
      grossProfit: summary.grossProfit,
      profitMarginPercent: summary.profitMarginPercent,
      postedToFinance: posted,
    }
  })
}

export async function getFinanceReportsBundle(month: string, year: number) {
  await checkFinanceAccess()

  if (!MONTHS.includes(month as (typeof MONTHS)[number])) {
    throw new Error("Invalid month")
  }

  const [pnl, salary, budget, lots] = await Promise.all([
    getMonthlyPnL(month, year),
    getSalaryReport(month, year),
    getBudgetVsActual(month, year),
    getLotProfitabilityReport(),
  ])

  return { pnl, salary, budget, lots }
}
