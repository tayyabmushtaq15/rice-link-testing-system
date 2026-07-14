"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const allowedRoles = ["ADMIN", "FINANCE_MANAGER"] as const

async function checkFinanceAccess() {
  const session = await auth()
  if (!session?.user?.role || !allowedRoles.includes(session.user.role as (typeof allowedRoles)[number])) {
    throw new Error("Unauthorized")
  }
}

function toOptionalString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : ""
}

function toNumber(value: FormDataEntryValue | null) {
  const parsed = Number(toOptionalString(value))
  return Number.isFinite(parsed) ? parsed : 0
}

function toDate(value: FormDataEntryValue | null) {
  const raw = toOptionalString(value)
  return raw ? new Date(raw) : new Date()
}

function toBoolean(value: FormDataEntryValue | null) {
  return value === "true"
}

function makeTransactionNo(prefix: string, count: number) {
  const today = new Date()
  const stamp = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`
  return `${prefix}-${stamp}-${String(count + 1).padStart(4, "0")}`
}

async function ensureDefaultExpenseCategories() {
  const count = await prisma.expenseCategory.count()
  if (count > 0) return

  const defaults = [
    "Electricity",
    "Salaries",
    "Fuel",
    "Travel",
    "Maintenance",
    "Machinery Repair",
    "Office Expenses",
    "Packing Material",
    "Transportation",
    "Internet",
    "Security",
    "Rent",
    "Taxes",
    "Miscellaneous",
  ]

  await prisma.expenseCategory.createMany({
    data: defaults.map((name) => ({
      name,
      description: `${name} expense category`,
      isActive: true,
    })),
  })
}

export async function getFinanceOverview() {
  await checkFinanceAccess()
  await ensureDefaultExpenseCategories()

  const [incomes, expenses, categories, recentIncomes, recentExpenses] = await Promise.all([
    prisma.income.findMany({ orderBy: { date: "desc" } }),
    prisma.expense.findMany({ where: { isDeleted: false }, orderBy: { date: "desc" } }),
    prisma.expenseCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.income.findMany({ orderBy: { date: "desc" }, take: 5 }),
    prisma.expense.findMany({ where: { isDeleted: false }, orderBy: { date: "desc" }, take: 5 }),
  ])

  const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0)
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0)
  const netProfit = totalIncome - totalExpenses

  const monthlyExpenseSummary = expenses.reduce<Record<string, number>>((acc, item) => {
    const month = item.date.toLocaleString("en-US", { month: "short", year: "numeric" })
    acc[month] = (acc[month] || 0) + item.amount
    return acc
  }, {})

  return {
    totalIncome,
    totalExpenses,
    netProfit,
    categories,
    monthlyExpenseSummary,
    recentTransactions: [
      ...recentIncomes.map((item) => ({ type: "income" as const, label: item.source, amount: item.amount, date: item.date })),
      ...recentExpenses.map((item) => ({ type: "expense" as const, label: item.description || item.vendorName || "Expense", amount: item.amount, date: item.date })),
    ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 8),
  }
}

export async function getExpenseCategories() {
  await checkFinanceAccess()
  await ensureDefaultExpenseCategories()
  return prisma.expenseCategory.findMany({ orderBy: { name: "asc" } })
}

export async function createOrUpdateExpenseCategory(formData: FormData) {
  await checkFinanceAccess()
  const id = toOptionalString(formData.get("id"))
  const name = toOptionalString(formData.get("name")).trim()
  const description = toOptionalString(formData.get("description")).trim()
  const isActive = toBoolean(formData.get("isActive"))

  if (!name) {
    throw new Error("Category name is required")
  }

  if (id) {
    await prisma.expenseCategory.update({
      where: { id },
      data: { name, description, isActive },
    })
  } else {
    await prisma.expenseCategory.create({
      data: { name, description, isActive },
    })
  }

  revalidatePath("/finance/categories")
  revalidatePath("/finance/dashboard")
}

export async function deleteExpenseCategory(id: string) {
  await checkFinanceAccess()
  await prisma.expenseCategory.update({ where: { id }, data: { isActive: false } })
  revalidatePath("/finance/categories")
  revalidatePath("/finance/dashboard")
}

export async function getIncomes() {
  await checkFinanceAccess()
  return prisma.income.findMany({ orderBy: { date: "desc" } })
}

export async function createOrUpdateIncome(formData: FormData) {
  await checkFinanceAccess()
  const id = toOptionalString(formData.get("id"))
  const source = toOptionalString(formData.get("source")).trim()
  const description = toOptionalString(formData.get("description")).trim()
  const amount = toNumber(formData.get("amount"))
  const paymentMethod = toOptionalString(formData.get("paymentMethod")).trim()
  const referenceNumber = toOptionalString(formData.get("referenceNumber")).trim()
  const notes = toOptionalString(formData.get("notes")).trim()
  const date = toDate(formData.get("date"))

  if (!source || !paymentMethod || amount <= 0) {
    throw new Error("Income source, payment method, and amount are required")
  }

  const transactionNo = id
    ? undefined
    : makeTransactionNo("INC", await prisma.income.count())

  if (id) {
    await prisma.income.update({
      where: { id },
      data: { source, description, amount, paymentMethod, referenceNumber: referenceNumber || null, notes: notes || null, date },
    })
  } else {
    await prisma.income.create({
      data: {
        transactionNo: transactionNo!,
        source,
        description,
        amount,
        paymentMethod,
        referenceNumber: referenceNumber || null,
        notes: notes || null,
        date,
        createdById: (await auth())?.user?.id || "",
      },
    })
  }

  revalidatePath("/finance/income")
  revalidatePath("/finance/dashboard")
}

export async function deleteIncome(id: string) {
  await checkFinanceAccess()
  await prisma.income.delete({ where: { id } })
  revalidatePath("/finance/income")
  revalidatePath("/finance/dashboard")
}

export async function getExpenses() {
  await checkFinanceAccess()
  return prisma.expense.findMany({
    where: { isDeleted: false },
    include: { category: true },
    orderBy: { date: "desc" },
  })
}

export async function createOrUpdateExpense(formData: FormData) {
  await checkFinanceAccess()
  const id = toOptionalString(formData.get("id"))
  const categoryId = toOptionalString(formData.get("categoryId")).trim()
  const vendorName = toOptionalString(formData.get("vendorName")).trim()
  const description = toOptionalString(formData.get("description")).trim()
  const amount = toNumber(formData.get("amount"))
  const paymentMethod = toOptionalString(formData.get("paymentMethod")).trim()
  const invoiceNumber = toOptionalString(formData.get("invoiceNumber")).trim()
  const attachment = toOptionalString(formData.get("attachment")).trim()
  const notes = toOptionalString(formData.get("notes")).trim()
  const date = toDate(formData.get("date"))

  if (!categoryId || !paymentMethod || amount <= 0) {
    throw new Error("Category, payment method, and amount are required")
  }

  const transactionNo = id
    ? undefined
    : makeTransactionNo("EXP", await prisma.expense.count())

  if (id) {
    await prisma.expense.update({
      where: { id },
      data: { categoryId, vendorName: vendorName || null, description: description || null, amount, paymentMethod, invoiceNumber: invoiceNumber || null, attachment: attachment || null, notes: notes || null, date },
    })
  } else {
    await prisma.expense.create({
      data: {
        transactionNo: transactionNo!,
        categoryId,
        vendorName: vendorName || null,
        description: description || null,
        amount,
        paymentMethod,
        invoiceNumber: invoiceNumber || null,
        attachment: attachment || null,
        notes: notes || null,
        date,
        createdById: (await auth())?.user?.id || "",
      },
    })
  }

  revalidatePath("/finance/expenses")
  revalidatePath("/finance/dashboard")
}

export async function deleteExpense(id: string) {
  await checkFinanceAccess()
  await prisma.expense.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } })
  revalidatePath("/finance/expenses")
  revalidatePath("/finance/dashboard")
}

export async function getEmployees() {
  await checkFinanceAccess()
  return prisma.employee.findMany({ orderBy: { name: "asc" } })
}

export async function createOrUpdateEmployee(formData: FormData) {
  await checkFinanceAccess()
  const id = toOptionalString(formData.get("id"))
  const name = toOptionalString(formData.get("name")).trim()
  const department = toOptionalString(formData.get("department")).trim()
  const designation = toOptionalString(formData.get("designation")).trim()
  const basicSalary = toNumber(formData.get("basicSalary"))
  const status = toOptionalString(formData.get("status")).trim() || "ACTIVE"

  if (!name || !department || !designation || basicSalary <= 0) {
    throw new Error("Employee details are required")
  }

  if (id) {
    await prisma.employee.update({
      where: { id },
      data: { name, department, designation, basicSalary, status },
    })
  } else {
    await prisma.employee.create({ data: { name, department, designation, basicSalary, status } })
  }

  revalidatePath("/finance/salaries")
}

export async function deleteEmployee(id: string) {
  await checkFinanceAccess()
  await prisma.employee.delete({ where: { id } })
  revalidatePath("/finance/salaries")
}

export async function getSalaries() {
  await checkFinanceAccess()
  return prisma.salary.findMany({ include: { employee: true }, orderBy: { year: "desc" } })
}

export async function createOrUpdateSalary(formData: FormData) {
  await checkFinanceAccess()
  const id = toOptionalString(formData.get("id"))
  const employeeId = toOptionalString(formData.get("employeeId")).trim()
  const month = toOptionalString(formData.get("month")).trim()
  const year = Number(toOptionalString(formData.get("year")))
  const basicSalary = toNumber(formData.get("basicSalary"))
  const allowances = toNumber(formData.get("allowances"))
  const deductions = toNumber(formData.get("deductions"))
  const bonus = toNumber(formData.get("bonus"))
  const overtime = toNumber(formData.get("overtime"))
  const netSalary = toNumber(formData.get("netSalary"))
  const paymentStatus = toOptionalString(formData.get("paymentStatus")).trim() || "PENDING"
  const paymentDate = toOptionalString(formData.get("paymentDate"))

  if (!employeeId || !month || !year || basicSalary <= 0) {
    throw new Error("Employee, month, year, and basic salary are required")
  }

  if (id) {
    await prisma.salary.update({
      where: { id },
      data: { employeeId, month, year, basicSalary, allowances, deductions, bonus, overtime, netSalary, paymentStatus, paymentDate: paymentDate ? new Date(paymentDate) : null },
    })
  } else {
    await prisma.salary.create({
      data: { employeeId, month, year, basicSalary, allowances, deductions, bonus, overtime, netSalary, paymentStatus, paymentDate: paymentDate ? new Date(paymentDate) : null },
    })
  }

  revalidatePath("/finance/salaries")
}

export async function deleteSalary(id: string) {
  await checkFinanceAccess()
  await prisma.salary.delete({ where: { id } })
  revalidatePath("/finance/salaries")
}

export async function getBudgets() {
  await checkFinanceAccess()
  return prisma.budget.findMany({ include: { category: true }, orderBy: { year: "desc" } })
}

export async function createOrUpdateBudget(formData: FormData) {
  await checkFinanceAccess()
  const id = toOptionalString(formData.get("id"))
  const categoryId = toOptionalString(formData.get("categoryId")).trim()
  const month = toOptionalString(formData.get("month")).trim()
  const year = Number(toOptionalString(formData.get("year")))
  const budgetAmount = toNumber(formData.get("budgetAmount"))

  if (!categoryId || !month || !year || budgetAmount <= 0) {
    throw new Error("Category, month, year, and budget amount are required")
  }

  if (id) {
    await prisma.budget.update({ where: { id }, data: { categoryId, month, year, budgetAmount } })
  } else {
    await prisma.budget.create({ data: { categoryId, month, year, budgetAmount } })
  }

  revalidatePath("/finance/budgets")
  revalidatePath("/finance/dashboard")
}

export async function deleteBudget(id: string) {
  await checkFinanceAccess()
  await prisma.budget.delete({ where: { id } })
  revalidatePath("/finance/budgets")
  revalidatePath("/finance/dashboard")
}
