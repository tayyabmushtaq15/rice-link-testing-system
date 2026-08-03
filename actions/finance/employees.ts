"use server"

import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { checkFinanceAccess } from "./_shared"

const employeeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  department: z.string().min(1, "Department is required").max(100),
  designation: z.string().min(1, "Designation is required").max(100),
  basicSalary: z.coerce.number().positive("Basic salary must be greater than 0"),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
})

export type EmployeeFormValues = z.infer<typeof employeeSchema>

function revalidateEmployeePaths() {
  revalidatePath("/dashboard/finance/employees")
  revalidatePath("/dashboard/finance/salaries")
  revalidatePath("/dashboard/finance/expenses")
  revalidatePath("/dashboard/finance")
}

export async function getEmployees(includeInactive = false) {
  await checkFinanceAccess()
  return prisma.employee.findMany({
    where: includeInactive ? {} : { status: "ACTIVE" },
    orderBy: { name: "asc" },
  })
}

export async function getEmployeeList(search?: string, includeInactive = true) {
  await checkFinanceAccess()
  return prisma.employee.findMany({
    where: {
      ...(includeInactive ? {} : { status: "ACTIVE" }),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { department: { contains: search, mode: "insensitive" } },
              { designation: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      _count: { select: { salaries: true, expenses: true } },
    },
    orderBy: { name: "asc" },
  })
}

export async function getEmployeeById(id: string) {
  await checkFinanceAccess()
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      salaries: { orderBy: [{ year: "desc" }, { month: "desc" }], take: 12 },
      expenses: {
        where: { isDeleted: false },
        orderBy: { date: "desc" },
        take: 12,
        include: { category: { select: { name: true } } },
      },
    },
  })
  if (!employee) throw new Error("Employee not found")
  return employee
}

export async function getEmployeeStats() {
  await checkFinanceAccess()
  const [active, inactive, salaryAgg] = await Promise.all([
    prisma.employee.count({ where: { status: "ACTIVE" } }),
    prisma.employee.count({ where: { status: "INACTIVE" } }),
    prisma.employee.aggregate({
      where: { status: "ACTIVE" },
      _sum: { basicSalary: true },
      _avg: { basicSalary: true },
    }),
  ])
  return {
    active,
    inactive,
    totalBasicPayroll: salaryAgg._sum.basicSalary || 0,
    averageBasicSalary: salaryAgg._avg.basicSalary || 0,
  }
}

export async function createEmployee(data: EmployeeFormValues) {
  await checkFinanceAccess()
  const parsed = employeeSchema.parse(data)
  const employee = await prisma.employee.create({ data: parsed })
  revalidateEmployeePaths()
  return employee
}

export async function updateEmployee(id: string, data: EmployeeFormValues) {
  await checkFinanceAccess()
  const parsed = employeeSchema.parse(data)
  const employee = await prisma.employee.update({
    where: { id },
    data: parsed,
  })
  revalidateEmployeePaths()
  return employee
}

export async function deactivateEmployee(id: string) {
  await checkFinanceAccess()
  const employee = await prisma.employee.update({
    where: { id },
    data: { status: "INACTIVE" },
  })
  revalidateEmployeePaths()
  return employee
}

export async function activateEmployee(id: string) {
  await checkFinanceAccess()
  const employee = await prisma.employee.update({
    where: { id },
    data: { status: "ACTIVE" },
  })
  revalidateEmployeePaths()
  return employee
}
