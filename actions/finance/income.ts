"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import type { Prisma } from "@prisma/client"

const incomeSchema = z.object({
  transactionNo: z.string().optional().or(z.literal("")),
  date: z.coerce.date(),
  source: z.string().min(2, "Source must be at least 2 characters").max(100, "Source must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional().or(z.literal("")).nullable(),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  referenceNumber: z.string().max(100, "Reference number must be less than 100 characters").optional().or(z.literal("")).nullable(),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional().or(z.literal("")).nullable(),
  paddyLotId: z.string().optional().or(z.literal("")).nullable(),
})

export type IncomeFormValues = z.infer<typeof incomeSchema>

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

  // Count income records for this month
  const count = await prisma.income.count({
    where: {
      transactionNo: {
        startsWith: `INC-${monthKey}-`,
      },
    },
  })

  const sequence = String(count + 1).padStart(3, "0")
  return `INC-${monthKey}-${sequence}`
}

export async function getIncomeList(
  search?: string,
  startDate?: Date,
  endDate?: Date,
  limit = 50,
  offset = 0
) {
  await checkFinanceAccess()

  const whereClause: Prisma.IncomeWhereInput = {}

  if (search) {
    whereClause.OR = [
      { transactionNo: { contains: search, mode: "insensitive" } },
      { source: { contains: search, mode: "insensitive" } },
      { referenceNumber: { contains: search, mode: "insensitive" } },
    ]
  }

  if (startDate && endDate) {
    whereClause.date = {
      gte: startDate,
      lte: endDate,
    }
  }

  const [income, total] = await Promise.all([
    prisma.income.findMany({
      where: whereClause,
      include: {
        createdBy: {
          select: { name: true, email: true },
        },
      },
      orderBy: { date: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.income.count({ where: whereClause }),
  ])

  return { income, total }
}

export async function getIncomeById(id: string) {
  await checkFinanceAccess()

  const income = await prisma.income.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: { name: true, email: true },
      },
    },
  })

  if (!income) {
    throw new Error("Income record not found")
  }

  return income
}

export async function createIncome(data: IncomeFormValues) {
  const userId = await checkFinanceAccess()

  const parsedData = incomeSchema.parse(data)

  // Generate transaction number if not provided
  let transactionNo = parsedData.transactionNo
  if (!transactionNo) {
    transactionNo = await generateTransactionNo()
  } else {
    // Check if transaction number already exists
    const existing = await prisma.income.findUnique({
      where: { transactionNo },
    })
    if (existing) {
      throw new Error("Income record with this transaction number already exists")
    }
  }

  const income = await prisma.income.create({
    data: {
      transactionNo,
      date: parsedData.date,
      source: parsedData.source,
      description: parsedData.description || null,
      amount: parsedData.amount,
      paymentMethod: parsedData.paymentMethod,
      referenceNumber: parsedData.referenceNumber || null,
      notes: parsedData.notes || null,
      paddyLotId: parsedData.paddyLotId || null,
      createdById: userId,
    },
    include: {
      createdBy: {
        select: { name: true, email: true },
      },
      paddyLot: { select: { id: true, lotNumber: true } },
    },
  })

  revalidatePath("/dashboard/finance/income")
  revalidatePath("/dashboard/finance")
  return income
}

export async function updateIncome(id: string, data: IncomeFormValues) {
  await checkFinanceAccess()

  const parsedData = incomeSchema.parse(data)

  // Check if another income record already has this transaction number
  if (parsedData.transactionNo) {
    const existing = await prisma.income.findFirst({
      where: {
        transactionNo: parsedData.transactionNo,
        NOT: { id },
      },
    })
    if (existing) {
      throw new Error("Income record with this transaction number already exists")
    }
  }

  const income = await prisma.income.update({
    where: { id },
    data: {
      date: parsedData.date,
      source: parsedData.source,
      description: parsedData.description || null,
      amount: parsedData.amount,
      paymentMethod: parsedData.paymentMethod,
      referenceNumber: parsedData.referenceNumber || null,
      notes: parsedData.notes || null,
      paddyLotId: parsedData.paddyLotId || null,
    },
    include: {
      createdBy: {
        select: { name: true, email: true },
      },
      paddyLot: { select: { id: true, lotNumber: true } },
    },
  })

  revalidatePath("/dashboard/finance/income")
  revalidatePath(`/dashboard/finance/income/${id}/edit`)
  revalidatePath("/dashboard/finance")
  return income
}

export async function deleteIncome(id: string) {
  await checkFinanceAccess()

  await prisma.income.delete({
    where: { id },
  })

  revalidatePath("/dashboard/finance/income")
}

export async function getIncomeStats(startDate?: Date, endDate?: Date) {
  await checkFinanceAccess()

  const whereClause: Prisma.IncomeWhereInput = {}

  if (startDate && endDate) {
    whereClause.date = {
      gte: startDate,
      lte: endDate,
    }
  }

  const stats = await prisma.income.aggregate({
    where: whereClause,
    _sum: { amount: true },
    _count: true,
  })

  return {
    totalIncome: stats._sum.amount || 0,
    count: stats._count,
  }
}

export async function getIncomeByDateRange(startDate: Date, endDate: Date) {
  await checkFinanceAccess()

  return await prisma.income.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: "desc" },
  })
}
