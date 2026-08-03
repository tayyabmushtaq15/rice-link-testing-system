"use server"

import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import type { Prisma } from "@prisma/client"
import { FINANCE_SOURCE } from "@/lib/finance"
import {
  checkFinanceAccess,
  ensureCategoryByName,
  generateExpenseTransactionNo,
} from "./_shared"

const salarySchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  month: z.string().min(1, "Month is required"),
  year: z.coerce.number().int().min(2000),
  basicSalary: z.coerce.number().positive("Basic salary must be greater than 0"),
  allowances: z.coerce.number().min(0, "Allowances cannot be negative"),
  deductions: z.coerce.number().min(0, "Deductions cannot be negative"),
  bonus: z.coerce.number().min(0, "Bonus cannot be negative"),
  overtime: z.coerce.number().min(0, "Overtime cannot be negative"),
  paymentStatus: z.enum(["PENDING", "PAID"], { message: "Invalid payment status" }),
  paymentDate: z.coerce.date().optional().or(z.literal("")),
})

export type SalaryFormValues = z.infer<typeof salarySchema>

async function syncSalaryExpense(params: {
  salaryId: string
  employeeId: string
  employeeName: string
  month: string
  year: number
  netSalary: number
  paymentStatus: string
  paymentDate: Date | null
  userId: string
}) {
  const existing = await prisma.expense.findUnique({
    where: {
      sourceType_sourceId: {
        sourceType: FINANCE_SOURCE.SALARY,
        sourceId: params.salaryId,
      },
    },
  })

  if (params.paymentStatus === "PAID") {
    if (existing && !existing.isDeleted) {
      await prisma.expense.update({
        where: { id: existing.id },
        data: {
          amount: params.netSalary,
          date: params.paymentDate || new Date(),
          description: `Salary payment - ${params.employeeName} (${params.month} ${params.year})`,
          employeeId: params.employeeId,
          vendorName: params.employeeName,
        },
      })
      return
    }

    if (existing?.isDeleted) {
      await prisma.expense.update({
        where: { id: existing.id },
        data: {
          isDeleted: false,
          deletedAt: null,
          amount: params.netSalary,
          date: params.paymentDate || new Date(),
          description: `Salary payment - ${params.employeeName} (${params.month} ${params.year})`,
          employeeId: params.employeeId,
          vendorName: params.employeeName,
        },
      })
      return
    }

    const category = await ensureCategoryByName("Salaries")
    await prisma.expense.create({
      data: {
        transactionNo: await generateExpenseTransactionNo(),
        date: params.paymentDate || new Date(),
        categoryId: category.id,
        vendorName: params.employeeName,
        description: `Salary payment - ${params.employeeName} (${params.month} ${params.year})`,
        amount: params.netSalary,
        paymentMethod: "Bank Transfer",
        notes: `Auto-posted from salary ${params.salaryId}`,
        sourceType: FINANCE_SOURCE.SALARY,
        sourceId: params.salaryId,
        employeeId: params.employeeId,
        createdById: params.userId,
      },
    })
    return
  }

  if (existing && !existing.isDeleted) {
    await prisma.expense.update({
      where: { id: existing.id },
      data: { isDeleted: true, deletedAt: new Date() },
    })
  }
}

export async function getSalaryList(
  employeeId?: string,
  limit = 50,
  offset = 0
) {
  await checkFinanceAccess()

  const whereClause: Prisma.SalaryWhereInput = {}
  if (employeeId) whereClause.employeeId = employeeId

  const [salaries, total] = await Promise.all([
    prisma.salary.findMany({
      where: whereClause,
      include: { employee: true },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      take: limit,
      skip: offset,
    }),
    prisma.salary.count({ where: whereClause }),
  ])

  return { salaries, total }
}

export async function getSalaryById(id: string) {
  await checkFinanceAccess()
  const salary = await prisma.salary.findUnique({
    where: { id },
    include: { employee: true },
  })
  if (!salary) throw new Error("Salary record not found")
  return salary
}

export async function createSalary(data: SalaryFormValues) {
  const userId = await checkFinanceAccess()
  const parsedData = salarySchema.parse(data)

  const existing = await prisma.salary.findFirst({
    where: {
      employeeId: parsedData.employeeId,
      month: parsedData.month,
      year: parsedData.year,
    },
  })
  if (existing) throw new Error("Salary record already exists for this employee in this period")

  const netSalary =
    parsedData.basicSalary +
    parsedData.allowances +
    parsedData.bonus +
    parsedData.overtime -
    parsedData.deductions

  const paymentDate =
    parsedData.paymentStatus === "PAID" && parsedData.paymentDate
      ? parsedData.paymentDate instanceof Date
        ? parsedData.paymentDate
        : null
      : parsedData.paymentStatus === "PAID"
        ? new Date()
        : null

  const salary = await prisma.salary.create({
    data: {
      employeeId: parsedData.employeeId,
      month: parsedData.month,
      year: parsedData.year,
      basicSalary: parsedData.basicSalary,
      allowances: parsedData.allowances,
      deductions: parsedData.deductions,
      bonus: parsedData.bonus,
      overtime: parsedData.overtime,
      netSalary,
      paymentStatus: parsedData.paymentStatus,
      paymentDate,
    },
    include: { employee: true },
  })

  await syncSalaryExpense({
    salaryId: salary.id,
    employeeId: salary.employeeId,
    employeeName: salary.employee.name,
    month: salary.month,
    year: salary.year,
    netSalary: salary.netSalary,
    paymentStatus: salary.paymentStatus,
    paymentDate: salary.paymentDate,
    userId,
  })

  revalidatePath("/dashboard/finance/salaries")
  revalidatePath("/dashboard/finance/expenses")
  revalidatePath("/dashboard/finance")
  return salary
}

export async function updateSalary(id: string, data: SalaryFormValues) {
  const userId = await checkFinanceAccess()
  const parsedData = salarySchema.parse(data)

  const netSalary =
    parsedData.basicSalary +
    parsedData.allowances +
    parsedData.bonus +
    parsedData.overtime -
    parsedData.deductions

  const paymentDate =
    parsedData.paymentStatus === "PAID" && parsedData.paymentDate
      ? parsedData.paymentDate instanceof Date
        ? parsedData.paymentDate
        : null
      : parsedData.paymentStatus === "PAID"
        ? new Date()
        : null

  const salary = await prisma.salary.update({
    where: { id },
    data: {
      employeeId: parsedData.employeeId,
      basicSalary: parsedData.basicSalary,
      allowances: parsedData.allowances,
      deductions: parsedData.deductions,
      bonus: parsedData.bonus,
      overtime: parsedData.overtime,
      netSalary,
      paymentStatus: parsedData.paymentStatus,
      paymentDate,
    },
    include: { employee: true },
  })

  await syncSalaryExpense({
    salaryId: salary.id,
    employeeId: salary.employeeId,
    employeeName: salary.employee.name,
    month: salary.month,
    year: salary.year,
    netSalary: salary.netSalary,
    paymentStatus: salary.paymentStatus,
    paymentDate: salary.paymentDate,
    userId,
  })

  revalidatePath("/dashboard/finance/salaries")
  revalidatePath("/dashboard/finance/expenses")
  revalidatePath("/dashboard/finance")
  return salary
}

export async function deleteSalary(id: string) {
  await checkFinanceAccess()

  const linked = await prisma.expense.findUnique({
    where: {
      sourceType_sourceId: {
        sourceType: FINANCE_SOURCE.SALARY,
        sourceId: id,
      },
    },
  })
  if (linked && !linked.isDeleted) {
    await prisma.expense.update({
      where: { id: linked.id },
      data: { isDeleted: true, deletedAt: new Date() },
    })
  }

  await prisma.salary.delete({ where: { id } })
  revalidatePath("/dashboard/finance/salaries")
  revalidatePath("/dashboard/finance/expenses")
}

export async function getSalaryStats() {
  await checkFinanceAccess()
  const stats = await prisma.salary.aggregate({
    _sum: { netSalary: true },
    _count: true,
  })
  return {
    totalSalaries: stats._sum.netSalary || 0,
    count: stats._count,
  }
}
