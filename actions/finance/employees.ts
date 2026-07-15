"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { z } from "zod"
import { revalidatePath } from "next/cache"

const employeeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  department: z.string().min(1, "Department is required"),
  designation: z.string().min(1, "Designation is required"),
  basicSalary: z.coerce.number().positive("Basic salary must be greater than 0"),
})

export type EmployeeFormValues = z.infer<typeof employeeSchema>

async function checkFinanceAccess() {
  const session = await auth()
  if (!session || !["ADMIN", "FINANCE_MANAGER"].includes(session.user?.role as string)) {
    throw new Error("Unauthorized: Only Admins and Finance Managers can perform this action")
  }
}

export async function getEmployees() {
  await checkFinanceAccess()
  return await prisma.employee.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
  })
}

export async function getEmployeeById(id: string) {
  await checkFinanceAccess()
  const employee = await prisma.employee.findUnique({ where: { id } })
  if (!employee) throw new Error("Employee not found")
  return employee
}

export async function createEmployee(data: EmployeeFormValues) {
  await checkFinanceAccess()
  const parsedData = employeeSchema.parse(data)
  const employee = await prisma.employee.create({
    data: parsedData,
  })
  revalidatePath("/dashboard/finance/salaries")
  return employee
}

export async function updateEmployee(id: string, data: EmployeeFormValues) {
  await checkFinanceAccess()
  const parsedData = employeeSchema.parse(data)
  const employee = await prisma.employee.update({
    where: { id },
    data: parsedData,
  })
  revalidatePath("/dashboard/finance/salaries")
  return employee
}

export async function deactivateEmployee(id: string) {
  await checkFinanceAccess()
  const employee = await prisma.employee.update({
    where: { id },
    data: { status: "INACTIVE" },
  })
  revalidatePath("/dashboard/finance/salaries")
  return employee
}
