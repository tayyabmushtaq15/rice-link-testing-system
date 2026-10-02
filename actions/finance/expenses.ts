"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import type { Prisma } from "@prisma/client"
import { syncExpenseJournalEntry } from "@/lib/ledger"
import { paginate, parseListQuery, withTiebreak, type SortDir } from "@/lib/listQuery"

const EXPENSE_SORT_KEYS = ["date", "category", "amount", "vendor"] as const
type ExpenseSortKey = (typeof EXPENSE_SORT_KEYS)[number]

function expenseOrderBy(sort: ExpenseSortKey, dir: SortDir) {
  const primary: Record<ExpenseSortKey, Prisma.ExpenseOrderByWithRelationInput> = {
    date: { date: dir },
    category: { category: { name: dir } },
    amount: { amount: dir },
    vendor: { vendorName: dir },
  }
  return withTiebreak(primary[sort], dir)
}

const expenseSchema = z.object({
  date: z.coerce.date(),
  categoryId: z.string().min(1, "Category is required"),
  vendorName: z
    .string()
    .max(100, "Vendor name must be less than 100 characters")
    .optional()
    .or(z.literal(""))
    .nullable(),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .or(z.literal(""))
    .nullable(),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  invoiceNumber: z
    .string()
    .max(100, "Invoice number must be less than 100 characters")
    .optional()
    .or(z.literal(""))
    .nullable(),
  attachment: z
    .string()
    .max(500, "Attachment URL must be less than 500 characters")
    .optional()
    .or(z.literal(""))
    .nullable(),
  notes: z
    .string()
    .max(500, "Notes must be less than 500 characters")
    .optional()
    .or(z.literal(""))
    .nullable(),
  paddyLotId: z.string().optional().or(z.literal("")).nullable(),
  employeeId: z.string().optional().or(z.literal("")).nullable(),
})

export type ExpenseFormValues = z.infer<typeof expenseSchema>

// Helper to check if user is admin or finance manager
async function checkFinanceAccess() {
  const session = await auth()
  if (!session || !["ADMIN", "FINANCE_MANAGER"].includes(session.user?.role as string)) {
    throw new Error("Unauthorized: Only Admins and Finance Managers can perform this action")
  }
  return session.user.id
}

// Generate transaction number
async function generateTransactionNo(): Promise<string> {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const monthKey = `${year}${month}`

  // Count ALL expense records for this month, including soft-deleted ones — a deleted row's
  // transactionNo is still permanently taken (the unique constraint doesn't exempt it), so
  // excluding deleted rows here would make this keep proposing an already-used number.
  const count = await prisma.expense.count({
    where: {
      transactionNo: {
        startsWith: `EXP-${monthKey}-`,
      },
    },
  })

  const sequence = String(count + 1).padStart(3, "0")
  return `EXP-${monthKey}-${sequence}`
}

export async function getExpenseList(params: {
  search?: string
  categoryId?: string
  startDate?: Date
  endDate?: Date
  page?: string
  sort?: string
  dir?: string
} = {}) {
  await checkFinanceAccess()

  const { search, categoryId, startDate, endDate } = params
  const whereClause: Prisma.ExpenseWhereInput = {
    isDeleted: false,
  }

  if (search) {
    whereClause.OR = [
      { transactionNo: { contains: search, mode: "insensitive" } },
      { vendorName: { contains: search, mode: "insensitive" } },
      { invoiceNumber: { contains: search, mode: "insensitive" } },
    ]
  }

  if (categoryId) {
    whereClause.categoryId = categoryId
  }

  if (startDate && endDate) {
    whereClause.date = {
      gte: startDate,
      lte: endDate,
    }
  }

  const { sort, dir } = parseListQuery(params, {
    allowedSorts: EXPENSE_SORT_KEYS,
    defaultSort: "date",
    defaultDir: "desc",
  })
  const orderBy = expenseOrderBy(sort, dir)

  const result = await paginate(
    () => prisma.expense.count({ where: whereClause }),
    ({ skip, take }) =>
      prisma.expense.findMany({
        where: whereClause,
        include: {
          category: true,
          createdBy: {
            select: { name: true, email: true },
          },
        },
        orderBy,
        skip,
        take,
      }),
    Number(params.page) || 1,
  )

  return { ...result, sort, dir }
}

export async function getExpenseById(id: string) {
  await checkFinanceAccess()

  const expense = await prisma.expense.findUnique({
    where: { id },
    include: {
      category: true,
      createdBy: {
        select: { name: true, email: true },
      },
    },
  })

  if (!expense || expense.isDeleted) {
    throw new Error("Expense record not found")
  }

  return expense
}

export async function createExpense(data: ExpenseFormValues) {
  const userId = await checkFinanceAccess()

  const parsedData = expenseSchema.parse(data)

  // Verify category exists and is active
  const category = await prisma.expenseCategory.findUnique({
    where: { id: parsedData.categoryId },
  })

  if (!category) {
    throw new Error("Selected category does not exist")
  }

  if (!category.isActive) {
    throw new Error("Selected category is inactive")
  }

  // Generate transaction number
  const transactionNo = await generateTransactionNo()

  const expense = await prisma.$transaction(async (tx) => {
    const created = await tx.expense.create({
      data: {
        transactionNo,
        date: parsedData.date,
        categoryId: parsedData.categoryId,
        vendorName: parsedData.vendorName || null,
        description: parsedData.description || null,
        amount: parsedData.amount,
        paymentMethod: parsedData.paymentMethod,
        invoiceNumber: parsedData.invoiceNumber || null,
        attachment: parsedData.attachment || null,
        notes: parsedData.notes || null,
        paddyLotId: parsedData.paddyLotId || null,
        employeeId: parsedData.employeeId || null,
        createdById: userId,
      },
      include: {
        category: true,
        createdBy: {
          select: { name: true, email: true },
        },
        paddyLot: { select: { id: true, lotNumber: true } },
        employee: { select: { id: true, name: true, basicSalary: true } },
      },
    })
    await syncExpenseJournalEntry(tx, created.id)
    return created
  })

  revalidatePath("/dashboard/finance/expenses")
  revalidatePath("/dashboard/finance")
  return expense
}

export async function updateExpense(id: string, data: ExpenseFormValues) {
  await checkFinanceAccess()

  const parsedData = expenseSchema.parse(data)

  // Verify category exists and is active
  const category = await prisma.expenseCategory.findUnique({
    where: { id: parsedData.categoryId },
  })

  if (!category) {
    throw new Error("Selected category does not exist")
  }

  if (!category.isActive) {
    throw new Error("Selected category is inactive")
  }

  const expense = await prisma.$transaction(async (tx) => {
    const updated = await tx.expense.update({
      where: { id },
      data: {
        date: parsedData.date,
        categoryId: parsedData.categoryId,
        vendorName: parsedData.vendorName || null,
        description: parsedData.description || null,
        amount: parsedData.amount,
        paymentMethod: parsedData.paymentMethod,
        invoiceNumber: parsedData.invoiceNumber || null,
        attachment: parsedData.attachment || null,
        notes: parsedData.notes || null,
        paddyLotId: parsedData.paddyLotId || null,
        employeeId: parsedData.employeeId || null,
      },
      include: {
        category: true,
        createdBy: {
          select: { name: true, email: true },
        },
        paddyLot: { select: { id: true, lotNumber: true } },
        employee: { select: { id: true, name: true, basicSalary: true } },
      },
    })
    await syncExpenseJournalEntry(tx, updated.id)
    return updated
  })

  revalidatePath("/dashboard/finance/expenses")
  revalidatePath(`/dashboard/finance/expenses/${id}/edit`)
  revalidatePath("/dashboard/finance")
  return expense
}

export async function softDeleteExpense(id: string) {
  await checkFinanceAccess()

  const expense = await prisma.$transaction(async (tx) => {
    const updated = await tx.expense.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    })
    await syncExpenseJournalEntry(tx, updated.id)
    return updated
  })

  revalidatePath("/dashboard/finance/expenses")
  return expense
}

export async function getExpenseStats(categoryId?: string, startDate?: Date, endDate?: Date) {
  await checkFinanceAccess()

  const whereClause: Prisma.ExpenseWhereInput = {
    isDeleted: false,
  }

  if (categoryId) {
    whereClause.categoryId = categoryId
  }

  if (startDate && endDate) {
    whereClause.date = {
      gte: startDate,
      lte: endDate,
    }
  }

  const stats = await prisma.expense.aggregate({
    where: whereClause,
    _sum: { amount: true },
    _count: true,
  })

  return {
    totalExpenses: stats._sum.amount || 0,
    count: stats._count,
  }
}

export async function getExpensesByCategory(startDate?: Date, endDate?: Date) {
  await checkFinanceAccess()

  const whereClause: Prisma.ExpenseWhereInput = {
    isDeleted: false,
  }

  if (startDate && endDate) {
    whereClause.date = {
      gte: startDate,
      lte: endDate,
    }
  }

  return await prisma.expenseCategory.findMany({
    where: { isActive: true },
    include: {
      expenses: {
        where: whereClause,
      },
    },
  })
}

export async function getExpensesByDateRange(startDate: Date, endDate: Date) {
  await checkFinanceAccess()

  return await prisma.expense.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
      isDeleted: false,
    },
    include: {
      category: true,
    },
    orderBy: { date: "desc" },
  })
}
