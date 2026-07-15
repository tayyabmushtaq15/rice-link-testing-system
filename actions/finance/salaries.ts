"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import type { Prisma } from "@prisma/client"

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

async function checkFinanceAccess() {
  const session = await auth()
  if (!session || !["ADMIN", "FINANCE_MANAGER"].includes(session.user?.role as string)) {
    throw new Error("Unauthorized: Only Admins and Finance Managers can perform this action")
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
      orderBy: { year: "desc", month: "desc" },
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
  await checkFinanceAccess()
  const parsedData = salarySchema.parse(data)

  // Check if employee already has salary for this month/year
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
      paymentDate: parsedData.paymentStatus === "PAID" ? parsedData.paymentDate : null,
    },
    include: { employee: true },
  })
  revalidatePath("/dashboard/finance/salaries")
  return salary
}

export async function updateSalary(id: string, data: SalaryFormValues) {
  await checkFinanceAccess()
  const parsedData = salarySchema.parse(data)

  const netSalary =
    parsedData.basicSalary +
    parsedData.allowances +
    parsedData.bonus +
    parsedData.overtime -
    parsedData.deductions

  const salary = await prisma.salary.update({
    where: { id },
    data: {
      basicSalary: parsedData.basicSalary,
      allowances: parsedData.allowances,
      deductions: parsedData.deductions,
      bonus: parsedData.bonus,
      overtime: parsedData.overtime,
      netSalary,
      paymentStatus: parsedData.paymentStatus,
      paymentDate: parsedData.paymentStatus === "PAID" ? parsedData.paymentDate : null,
    },
    include: { employee: true },
  })
  revalidatePath("/dashboard/finance/salaries")
  return salary
}

export async function deleteSalary(id: string) {
  await checkFinanceAccess()
  await prisma.salary.delete({ where: { id } })
  revalidatePath("/dashboard/finance/salaries")
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
