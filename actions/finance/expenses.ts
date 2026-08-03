"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import type { Prisma } from "@prisma/client"

const expenseSchema = z.object({
  date: z.coerce.date(),
  categoryId: z.string().min(1, "Category is required"),
  vendorName: z.string().max(100, "Vendor name must be less than 100 characters").optional().or(z.literal("")).nullable(),
  description: z.string().max(500, "Description must be less than 500 characters").optional().or(z.literal("")).nullable(),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  invoiceNumber: z.string().max(100, "Invoice number must be less than 100 characters").optional().or(z.literal("")).nullable(),
  attachment: z.string().max(500, "Attachment URL must be less than 500 characters").optional().or(z.literal("")).nullable(),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional().or(z.literal("")).nullable(),
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

  // Count expense records for this month (excluding soft-deleted)
  const count = await prisma.expense.count({
    where: {
      transactionNo: {
        startsWith: `EXP-${monthKey}-`,
      },
      isDeleted: false,
    },
  })

  const sequence = String(count + 1).padStart(3, "0")
  return `EXP-${monthKey}-${sequence}`
}

export async function getExpenseList(
  search?: string,
  categoryId?: string,
  startDate?: Date,
  endDate?: Date,
  limit = 50,
  offset = 0
) {
  await checkFinanceAccess()

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

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where: whereClause,
      include: {
        category: true,
        createdBy: {
          select: { name: true, email: true },
        },
      },
      orderBy: { date: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.expense.count({ where: whereClause }),
  ])

  return { expenses, total }
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

  const expense = await prisma.expense.create({
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

  const expense = await prisma.expense.update({
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

  revalidatePath("/dashboard/finance/expenses")
  revalidatePath(`/dashboard/finance/expenses/${id}/edit`)
  revalidatePath("/dashboard/finance")
  return expense
}

export async function softDeleteExpense(id: string) {
  await checkFinanceAccess()

  const expense = await prisma.expense.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
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
