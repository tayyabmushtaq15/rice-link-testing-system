"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { DEFAULT_EXPENSE_CATEGORIES } from "@/lib/finance"

export async function checkFinanceAccess() {
  const session = await auth()
  if (!session?.user?.role || !["ADMIN", "FINANCE_MANAGER"].includes(session.user.role as string)) {
    throw new Error("Unauthorized: Only Admins and Finance Managers can perform this action")
  }
  return session.user.id as string
}

export async function ensureDefaultExpenseCategories() {
  const existing = await prisma.expenseCategory.findMany({ select: { name: true } })
  const existingNames = new Set(existing.map((c) => c.name))
  const missing = DEFAULT_EXPENSE_CATEGORIES.filter((name) => !existingNames.has(name))
  if (missing.length === 0) return

  await prisma.expenseCategory.createMany({
    data: missing.map((name) => ({
      name,
      description: `${name} expense category`,
      isActive: true,
    })),
    skipDuplicates: true,
  })
}

export async function ensureCategoryByName(name: string) {
  await ensureDefaultExpenseCategories()
  const category = await prisma.expenseCategory.findUnique({ where: { name } })
  if (category) return category
  return prisma.expenseCategory.create({
    data: {
      name,
      description: `${name} expense category`,
      isActive: true,
    },
  })
}

export async function generateExpenseTransactionNo() {
  const now = new Date()
  const monthKey = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`
  const count = await prisma.expense.count({
    where: { transactionNo: { startsWith: `EXP-${monthKey}-` } },
  })
  return `EXP-${monthKey}-${String(count + 1).padStart(3, "0")}`
}

export async function generateIncomeTransactionNo() {
  const now = new Date()
  const monthKey = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`
  const count = await prisma.income.count({
    where: { transactionNo: { startsWith: `INC-${monthKey}-` } },
  })
  return `INC-${monthKey}-${String(count + 1).padStart(3, "0")}`
}
