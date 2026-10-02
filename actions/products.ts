"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { Prisma } from "@prisma/client"
import { paginate, parseListQuery, withTiebreak, type SortDir } from "@/lib/listQuery"

const PRODUCT_SORT_KEYS = ["name", "type", "category", "createdAt"] as const
type ProductSortKey = (typeof PRODUCT_SORT_KEYS)[number]

function productOrderBy(sort: ProductSortKey, dir: SortDir) {
  const primary: Record<ProductSortKey, Prisma.ProductOrderByWithRelationInput> = {
    name: { name: dir },
    type: { type: dir },
    category: { category: { name: dir } },
    createdAt: { createdAt: dir },
  }
  return withTiebreak(primary[sort], dir)
}

async function requireAdmin() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")
}

const productSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  sku: z.string().optional().or(z.literal("")),
  type: z.enum(["RAW_MATERIAL", "FINISHED_GOOD", "BY_PRODUCT", "PACKAGING"]),
  categoryId: z.string().optional().or(z.literal("")),
  unitId: z.string().min(1, "Unit is required"),
  requiresQa: z.boolean(),
})

export type ProductFormValues = z.infer<typeof productSchema>

export async function createProduct(data: ProductFormValues) {
  await requireAdmin()
  const parsed = productSchema.parse(data)
  const product = await prisma.product.create({
    data: {
      name: parsed.name,
      sku: parsed.sku || null,
      type: parsed.type,
      categoryId: parsed.categoryId || null,
      unitId: parsed.unitId,
      requiresQa: parsed.requiresQa,
    },
  })
  revalidatePath("/dashboard/products")
  return product
}

export async function updateProduct(id: string, data: ProductFormValues) {
  await requireAdmin()
  const parsed = productSchema.parse(data)
  const product = await prisma.product.update({
    where: { id },
    data: {
      name: parsed.name,
      sku: parsed.sku || null,
      type: parsed.type,
      categoryId: parsed.categoryId || null,
      unitId: parsed.unitId,
      requiresQa: parsed.requiresQa,
    },
  })
  revalidatePath("/dashboard/products")
  revalidatePath(`/dashboard/products/${id}/edit`)
  return product
}

export async function toggleProduct(id: string, active: boolean) {
  await requireAdmin()
  await prisma.product.update({ where: { id }, data: { isActive: active } })
  revalidatePath("/dashboard/products")
}

export async function createCategory(formData: FormData) {
  await requireAdmin()
  const name = String(formData.get("name") || "").trim()
  if (name.length < 2) throw new Error("Category name is required")
  await prisma.productCategory.create({
    data: { name, description: String(formData.get("description") || "").trim() || null },
  })
  revalidatePath("/dashboard/products")
  revalidatePath("/dashboard/products/settings")
}

export async function createUnit(formData: FormData) {
  await requireAdmin()
  const name = String(formData.get("name") || "").trim()
  const symbol = String(formData.get("symbol") || "")
    .trim()
    .toUpperCase()
  if (name.length < 2 || symbol.length < 1) throw new Error("Unit name and symbol are required")
  await prisma.unitOfMeasure.create({ data: { name, symbol } })
  revalidatePath("/dashboard/products")
  revalidatePath("/dashboard/products/settings")
}

export async function getProducts(params: {
  search?: string
  page?: string
  sort?: string
  dir?: string
} = {}) {
  await requireAdmin()
  const where: Prisma.ProductWhereInput = { isActive: true }
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { sku: { contains: params.search, mode: "insensitive" } },
    ]
  }

  const { sort, dir } = parseListQuery(params, {
    allowedSorts: PRODUCT_SORT_KEYS,
    defaultSort: "name",
    defaultDir: "asc",
  })
  const orderBy = productOrderBy(sort, dir)

  const result = await paginate(
    () => prisma.product.count({ where }),
    ({ skip, take }) =>
      prisma.product.findMany({
        where,
        include: { category: true, unit: true },
        orderBy,
        skip,
        take,
      }),
    Number(params.page) || 1,
  )

  return { ...result, sort, dir }
}

export async function getProduct(id: string) {
  await requireAdmin()
  return prisma.product.findUnique({ where: { id } })
}

export async function getProductFormSetup() {
  await requireAdmin()
  return Promise.all([
    prisma.productCategory.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.unitOfMeasure.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ])
}

export async function getProductSetup() {
  await requireAdmin()
  return Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      include: { category: true, unit: true },
      orderBy: { name: "asc" },
    }),
    prisma.productCategory.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.unitOfMeasure.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ])
}
