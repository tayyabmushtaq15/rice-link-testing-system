"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { Prisma } from "@prisma/client"
import { paginate, parseListQuery, withTiebreak, type SortDir } from "@/lib/listQuery"

const CUSTOMER_SORT_KEYS = ["name", "createdAt"] as const
type CustomerSortKey = (typeof CUSTOMER_SORT_KEYS)[number]

function customerOrderBy(sort: CustomerSortKey, dir: SortDir) {
  const primary: Record<CustomerSortKey, Prisma.CustomerOrderByWithRelationInput> = {
    name: { name: dir },
    createdAt: { createdAt: dir },
  }
  return withTiebreak(primary[sort], dir)
}

async function requireAdmin() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")
}

const customerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  contactName: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
})

export type CustomerFormValues = z.infer<typeof customerSchema>

export async function createCustomer(data: CustomerFormValues) {
  await requireAdmin()
  const parsed = customerSchema.parse(data)
  const customer = await prisma.customer.create({
    data: {
      name: parsed.name,
      contactName: parsed.contactName || null,
      phone: parsed.phone || null,
      email: parsed.email || null,
      address: parsed.address || null,
    },
  })
  revalidatePath("/dashboard/customers")
  return customer
}

export async function updateCustomer(id: string, data: CustomerFormValues) {
  await requireAdmin()
  const parsed = customerSchema.parse(data)
  const customer = await prisma.customer.update({
    where: { id },
    data: {
      name: parsed.name,
      contactName: parsed.contactName || null,
      phone: parsed.phone || null,
      email: parsed.email || null,
      address: parsed.address || null,
    },
  })
  revalidatePath("/dashboard/customers")
  revalidatePath(`/dashboard/customers/${id}/edit`)
  return customer
}

export async function toggleCustomer(id: string, active: boolean) {
  await requireAdmin()
  await prisma.customer.update({ where: { id }, data: { isActive: active } })
  revalidatePath("/dashboard/customers")
}

export async function getCustomers(params: {
  search?: string
  page?: string
  sort?: string
  dir?: string
} = {}) {
  await requireAdmin()
  const where: Prisma.CustomerWhereInput = { isActive: true }
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { contactName: { contains: params.search, mode: "insensitive" } },
    ]
  }

  const { sort, dir } = parseListQuery(params, {
    allowedSorts: CUSTOMER_SORT_KEYS,
    defaultSort: "name",
    defaultDir: "asc",
  })
  const orderBy = customerOrderBy(sort, dir)

  const result = await paginate(
    () => prisma.customer.count({ where }),
    ({ skip, take }) => prisma.customer.findMany({ where, orderBy, skip, take }),
    Number(params.page) || 1,
  )

  return { ...result, sort, dir }
}

export async function getCustomer(id: string) {
  await requireAdmin()
  return prisma.customer.findUnique({ where: { id } })
}
