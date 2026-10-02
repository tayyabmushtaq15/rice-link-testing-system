"use server"

import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { checkFinanceAccess } from "./_shared"
import type { Prisma } from "@prisma/client"
import { paginate, parseListQuery, withTiebreak, type SortDir } from "@/lib/listQuery"

const EMPLOYEE_SORT_KEYS = ["name", "department", "designation", "basicSalary"] as const
type EmployeeSortKey = (typeof EMPLOYEE_SORT_KEYS)[number]

function employeeOrderBy(sort: EmployeeSortKey, dir: SortDir) {
  const primary: Record<EmployeeSortKey, Prisma.EmployeeOrderByWithRelationInput> = {
    name: { name: dir },
    department: { department: dir },
    designation: { designation: dir },
    basicSalary: { basicSalary: dir },
  }
  return withTiebreak(primary[sort], dir)
}

const employeeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  department: z.string().min(1, "Department is required").max(100),
  designation: z.string().min(1, "Designation is required").max(100),
  basicSalary: z.coerce.number().positive("Basic salary must be greater than 0"),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  phone: z.string().optional().or(z.literal("")),
  cnic: z.string().optional().or(z.literal("")),
  joiningDate: z.coerce.date().optional().or(z.literal("")),
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

export async function getEmployeeList(params: {
  search?: string
  includeInactive?: boolean
  page?: string
  sort?: string
  dir?: string
} = {}) {
  await checkFinanceAccess()
  const { search, includeInactive = true } = params

  const where: Prisma.EmployeeWhereInput = {
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
  }

  const { sort, dir } = parseListQuery(params, {
    allowedSorts: EMPLOYEE_SORT_KEYS,
    defaultSort: "name",
    defaultDir: "asc",
  })
  const orderBy = employeeOrderBy(sort, dir)

  const result = await paginate(
    () => prisma.employee.count({ where }),
    ({ skip, take }) =>
      prisma.employee.findMany({
        where,
        include: { _count: { select: { salaries: true, expenses: true } } },
        orderBy,
        skip,
        take,
      }),
    Number(params.page) || 1,
  )

  return { ...result, sort, dir }
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
  const joiningDate = parsed.joiningDate instanceof Date ? parsed.joiningDate : null
  const employee = await prisma.employee.create({ data: { ...parsed, joiningDate } })
  revalidateEmployeePaths()
  return employee
}

export async function updateEmployee(id: string, data: EmployeeFormValues) {
  await checkFinanceAccess()
  const parsed = employeeSchema.parse(data)
  const joiningDate = parsed.joiningDate instanceof Date ? parsed.joiningDate : null
  const employee = await prisma.employee.update({
    where: { id },
    data: { ...parsed, joiningDate },
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
