"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import type { Prisma } from "@prisma/client"

const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional().or(z.literal("")).nullable(),
})

export type CategoryFormValues = z.infer<typeof categorySchema>

// Helper to check if user is admin or finance manager
async function checkFinanceAccess() {
  const session = await auth()
  if (!session || !["ADMIN", "FINANCE_MANAGER"].includes(session.user?.role as string)) {
    throw new Error("Unauthorized: Only Admins and Finance Managers can perform this action")
  }
}

export async function getCategories(search?: string) {
  await checkFinanceAccess()

  const whereClause: Prisma.ExpenseCategoryWhereInput = {
    isActive: true,
  }

  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ]
  }

  return await prisma.expenseCategory.findMany({
    where: whereClause,
    orderBy: { name: "asc" },
  })
}

export async function getAllCategories(includeInactive = false) {
  await checkFinanceAccess()

  return await prisma.expenseCategory.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { name: "asc" },
  })
}

export async function getCategoryById(id: string) {
  await checkFinanceAccess()

  const category = await prisma.expenseCategory.findUnique({
    where: { id },
  })

  if (!category) {
    throw new Error("Category not found")
  }

  return category
}

export async function createCategory(data: CategoryFormValues) {
  await checkFinanceAccess()

  const parsedData = categorySchema.parse(data)

  // Check if category name already exists
  const existingCategory = await prisma.expenseCategory.findUnique({
    where: { name: parsedData.name },
  })

  if (existingCategory) {
    throw new Error("A category with this name already exists")
  }

  const category = await prisma.expenseCategory.create({
    data: {
      name: parsedData.name,
      description: parsedData.description || null,
    },
  })

  revalidatePath("/dashboard/finance/categories")
  return category
}

export async function updateCategory(id: string, data: CategoryFormValues) {
  await checkFinanceAccess()

  const parsedData = categorySchema.parse(data)

  // Check if another category already has this name
  const existingCategory = await prisma.expenseCategory.findFirst({
    where: {
      name: parsedData.name,
      NOT: { id },
    },
  })

  if (existingCategory) {
    throw new Error("A category with this name already exists")
  }

  const category = await prisma.expenseCategory.update({
    where: { id },
    data: {
      name: parsedData.name,
      description: parsedData.description || null,
    },
  })

  revalidatePath("/dashboard/finance/categories")
  revalidatePath(`/dashboard/finance/categories/${id}/edit`)
  return category
}

export async function toggleCategoryStatus(id: string) {
  await checkFinanceAccess()

  const category = await prisma.expenseCategory.findUnique({
    where: { id },
  })

  if (!category) {
    throw new Error("Category not found")
  }

  const updatedCategory = await prisma.expenseCategory.update({
    where: { id },
    data: {
      isActive: !category.isActive,
    },
  })

  revalidatePath("/dashboard/finance/categories")
  return updatedCategory
}
