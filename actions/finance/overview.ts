"use server"

import { prisma } from "@/lib/prisma"
import { getMonthDateRange, getCurrentMonthYear } from "@/lib/finance"
import { checkFinanceAccess } from "./_shared"
import { getBudgetVsActual } from "./budgets"
import { getLotsFinancePostingStatus } from "./lotPosting"

export async function getFinanceOverview(month?: string, year?: number) {
  await checkFinanceAccess()

  const current = getCurrentMonthYear()
  const selectedMonth = month || current.month
  const selectedYear = year || current.year
  const { startDate, endDate } = getMonthDateRange(selectedMonth, selectedYear)

  const [incomeAgg, expenseAgg, recentIncomes, recentExpenses, budget, lots] =
    await Promise.all([
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
        take: 5,
        select: {
          id: true,
          transactionNo: true,
          date: true,
          source: true,
          amount: true,
        },
      }),
      prisma.expense.findMany({
        where: { isDeleted: false, date: { gte: startDate, lte: endDate } },
        orderBy: { date: "desc" },
        take: 5,
        include: { category: { select: { name: true } } },
      }),
      getBudgetVsActual(selectedMonth, selectedYear),
      getLotsFinancePostingStatus(),
    ])

  const totalIncome = incomeAgg._sum.amount || 0
  const totalExpenses = expenseAgg._sum.amount || 0
  const unpostedLots = lots.filter((l) => !l.posted)

  return {
    month: selectedMonth,
    year: selectedYear,
    totalIncome,
    totalExpenses,
    netProfit: totalIncome - totalExpenses,
    incomeCount: incomeAgg._count,
    expenseCount: expenseAgg._count,
    budgetUtilization: budget.totals.utilizationPercent,
    budgetTotal: budget.totals.totalBudget,
    budgetSpent: budget.totals.totalSpent,
    recentIncomes,
    recentExpenses: recentExpenses.map((e) => ({
      id: e.id,
      transactionNo: e.transactionNo,
      date: e.date,
      categoryName: e.category.name,
      amount: e.amount,
    })),
    unpostedLots: unpostedLots.slice(0, 8),
    postedLotsCount: lots.filter((l) => l.posted).length,
    unpostedLotsCount: unpostedLots.length,
  }
}
