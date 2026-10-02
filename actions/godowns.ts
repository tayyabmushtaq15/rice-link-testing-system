"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { Prisma } from "@prisma/client"
import { paginate, parseListQuery, withTiebreak, type SortDir } from "@/lib/listQuery"

const GODOWN_SORT_KEYS = ["name", "capacity", "createdAt"] as const
type GodownSortKey = (typeof GODOWN_SORT_KEYS)[number]

function godownOrderBy(sort: GodownSortKey, dir: SortDir) {
  const primary: Record<GodownSortKey, Prisma.GodownOrderByWithRelationInput> = {
    name: { name: dir },
    capacity: { capacity: dir },
    createdAt: { createdAt: dir },
  }
  return withTiebreak(primary[sort], dir)
}

async function requireAdmin() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")
}

const godownSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  location: z.string().optional().or(z.literal("")),
  capacity: z.coerce.number().min(0, "Capacity must be a positive number"),
  unitId: z.string().min(1, "Unit is required"),
})

export type GodownFormValues = z.infer<typeof godownSchema>

export async function createGodown(data: GodownFormValues) {
  await requireAdmin()
  const parsed = godownSchema.parse(data)
  const godown = await prisma.godown.create({
    data: {
      name: parsed.name,
      location: parsed.location || null,
      capacity: parsed.capacity,
      unitId: parsed.unitId,
    },
  })
  revalidatePath("/dashboard/godowns")
  return godown
}

export async function updateGodown(id: string, data: GodownFormValues) {
  await requireAdmin()
  const parsed = godownSchema.parse(data)
  const godown = await prisma.godown.update({
    where: { id },
    data: {
      name: parsed.name,
      location: parsed.location || null,
      capacity: parsed.capacity,
      unitId: parsed.unitId,
    },
  })
  revalidatePath("/dashboard/godowns")
  revalidatePath(`/dashboard/godowns/${id}/edit`)
  return godown
}

export async function toggleGodown(id: string, active: boolean) {
  await requireAdmin()
  await prisma.godown.update({ where: { id }, data: { isActive: active } })
  revalidatePath("/dashboard/godowns")
}

export async function getGodowns(params: {
  search?: string
  page?: string
  sort?: string
  dir?: string
} = {}) {
  await requireAdmin()
  const where: Prisma.GodownWhereInput = { isActive: true }
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { location: { contains: params.search, mode: "insensitive" } },
    ]
  }

  const { sort, dir } = parseListQuery(params, {
    allowedSorts: GODOWN_SORT_KEYS,
    defaultSort: "name",
    defaultDir: "asc",
  })
  const orderBy = godownOrderBy(sort, dir)

  const result = await paginate(
    () => prisma.godown.count({ where }),
    ({ skip, take }) => prisma.godown.findMany({ where, include: { unit: true }, orderBy, skip, take }),
    Number(params.page) || 1,
  )

  return { ...result, sort, dir }
}

export async function getGodown(id: string) {
  await requireAdmin()
  return prisma.godown.findUnique({ where: { id } })
}

export async function getUnits() {
  await requireAdmin()
  return prisma.unitOfMeasure.findMany({ where: { isActive: true }, orderBy: { name: "asc" } })
}
