"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { Prisma } from "@prisma/client"
import { paginate, parseListQuery, withTiebreak, type SortDir } from "@/lib/listQuery"

const SUPPLIER_SORT_KEYS = ["name", "createdAt"] as const
type SupplierSortKey = (typeof SUPPLIER_SORT_KEYS)[number]

function supplierOrderBy(sort: SupplierSortKey, dir: SortDir) {
  const primary: Record<SupplierSortKey, Prisma.SupplierOrderByWithRelationInput> = {
    name: { name: dir },
    createdAt: { createdAt: dir },
  }
  return withTiebreak(primary[sort], dir)
}

async function requireAdmin() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")
}

const supplierSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  contactName: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
})

export type SupplierFormValues = z.infer<typeof supplierSchema>

export async function createSupplier(data: SupplierFormValues) {
  await requireAdmin()
  const parsed = supplierSchema.parse(data)
  const supplier = await prisma.supplier.create({
    data: {
      name: parsed.name,
      contactName: parsed.contactName || null,
      phone: parsed.phone || null,
      email: parsed.email || null,
      address: parsed.address || null,
    },
  })
  revalidatePath("/dashboard/suppliers")
  return supplier
}

export async function updateSupplier(id: string, data: SupplierFormValues) {
  await requireAdmin()
  const parsed = supplierSchema.parse(data)
  const supplier = await prisma.supplier.update({
    where: { id },
    data: {
      name: parsed.name,
      contactName: parsed.contactName || null,
      phone: parsed.phone || null,
      email: parsed.email || null,
      address: parsed.address || null,
    },
  })
  revalidatePath("/dashboard/suppliers")
  revalidatePath(`/dashboard/suppliers/${id}/edit`)
  return supplier
}

export async function toggleSupplier(id: string, active: boolean) {
  await requireAdmin()
  await prisma.supplier.update({ where: { id }, data: { isActive: active } })
  revalidatePath("/dashboard/suppliers")
}

export async function getSuppliers(params: {
  search?: string
  page?: string
  sort?: string
  dir?: string
} = {}) {
  await requireAdmin()
  const where: Prisma.SupplierWhereInput = { isActive: true }
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { contactName: { contains: params.search, mode: "insensitive" } },
    ]
  }

  const { sort, dir } = parseListQuery(params, {
    allowedSorts: SUPPLIER_SORT_KEYS,
    defaultSort: "name",
    defaultDir: "asc",
  })
  const orderBy = supplierOrderBy(sort, dir)

  const result = await paginate(
    () => prisma.supplier.count({ where }),
    ({ skip, take }) => prisma.supplier.findMany({ where, orderBy, skip, take }),
    Number(params.page) || 1,
  )

  return { ...result, sort, dir }
}

export async function getSupplier(id: string) {
  await requireAdmin()
  return prisma.supplier.findUnique({ where: { id } })
}
