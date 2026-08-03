"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getMonthDateRange, MONTHS } from "@/lib/finance"
import { checkFinanceAccess } from "./_shared"

const budgetSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  month: z
    .string()
    .refine((m) => (MONTHS as readonly string[]).includes(m), "Month is required"),
  year: z.coerce.number().int().min(2000).max(2100),
  budgetAmount: z.coerce.number().positive("Budget amount must be greater than 0"),
})

export type BudgetFormValues = z.infer<typeof budgetSchema>

export async function getBudgetList(month?: string, year?: number) {
  await checkFinanceAccess()

  const where: { month?: string; year?: number } = {}
  if (month) where.month = month
  if (year) where.year = year

  return prisma.budget.findMany({
    where,
    include: { category: true },
    orderBy: [{ year: "desc" }, { month: "asc" }, { category: { name: "asc" } }],
  })
}

export async function getBudgetById(id: string) {
  await checkFinanceAccess()
  const budget = await prisma.budget.findUnique({
    where: { id },
    include: { category: true },
  })
  if (!budget) throw new Error("Budget not found")
  return budget
}

export async function createBudget(data: BudgetFormValues) {
  await checkFinanceAccess()
  const parsed = budgetSchema.parse(data)

  const category = await prisma.expenseCategory.findUnique({ where: { id: parsed.categoryId } })
  if (!category) throw new Error("Selected category does not exist")
  if (!category.isActive) throw new Error("Selected category is inactive")

  const existing = await prisma.budget.findUnique({
    where: {
      categoryId_month_year: {
        categoryId: parsed.categoryId,
        month: parsed.month,
        year: parsed.year,
      },
    },
  })
  if (existing) throw new Error("Budget already exists for this category and period")

  const budget = await prisma.budget.create({
    data: {
      categoryId: parsed.categoryId,
      month: parsed.month,
      year: parsed.year,
      budgetAmount: parsed.budgetAmount,
    },
    include: { category: true },
  })

  revalidatePath("/dashboard/finance/budgets")
  revalidatePath("/dashboard/finance")
  return budget
}

export async function updateBudget(id: string, data: BudgetFormValues) {
  await checkFinanceAccess()
  const parsed = budgetSchema.parse(data)

  const category = await prisma.expenseCategory.findUnique({ where: { id: parsed.categoryId } })
  if (!category) throw new Error("Selected category does not exist")

  const duplicate = await prisma.budget.findFirst({
    where: {
      categoryId: parsed.categoryId,
      month: parsed.month,
      year: parsed.year,
      NOT: { id },
    },
  })
  if (duplicate) throw new Error("Budget already exists for this category and period")

  const budget = await prisma.budget.update({
    where: { id },
    data: {
      categoryId: parsed.categoryId,
      month: parsed.month,
      year: parsed.year,
      budgetAmount: parsed.budgetAmount,
    },
    include: { category: true },
  })

  revalidatePath("/dashboard/finance/budgets")
  revalidatePath(`/dashboard/finance/budgets/${id}/edit`)
  revalidatePath("/dashboard/finance")
  return budget
}

export async function deleteBudget(id: string) {
  await checkFinanceAccess()
  await prisma.budget.delete({ where: { id } })
  revalidatePath("/dashboard/finance/budgets")
  revalidatePath("/dashboard/finance")
}

export async function getBudgetVsActual(month: string, year: number) {
  await checkFinanceAccess()
  const { startDate, endDate } = getMonthDateRange(month, year)

  const [budgets, expenses] = await Promise.all([
    prisma.budget.findMany({
      where: { month, year },
      include: { category: true },
      orderBy: { category: { name: "asc" } },
    }),
    prisma.expense.groupBy({
      by: ["categoryId"],
      where: {
        isDeleted: false,
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    }),
  ])

  const spentByCategory = new Map(
    expenses.map((e) => [e.categoryId, e._sum.amount || 0])
  )

  const rows = budgets.map((budget) => {
    const spent = spentByCategory.get(budget.categoryId) || 0
    const remaining = budget.budgetAmount - spent
    return {
      id: budget.id,
      categoryId: budget.categoryId,
      categoryName: budget.category.name,
      month: budget.month,
      year: budget.year,
      budgetAmount: budget.budgetAmount,
      spent,
      remaining,
      isOverspent: spent > budget.budgetAmount,
      utilizationPercent:
        budget.budgetAmount > 0
          ? Number(((spent / budget.budgetAmount) * 100).toFixed(1))
          : 0,
    }
  })

  const totalBudget = rows.reduce((sum, r) => sum + r.budgetAmount, 0)
  const totalSpent = rows.reduce((sum, r) => sum + r.spent, 0)

  return {
    rows,
    totals: {
      totalBudget,
      totalSpent,
      remaining: totalBudget - totalSpent,
      utilizationPercent:
        totalBudget > 0 ? Number(((totalSpent / totalBudget) * 100).toFixed(1)) : 0,
    },
  }
}
