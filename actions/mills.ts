"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import type { Prisma } from "@prisma/client"
import { paginate, parseListQuery, withTiebreak, type SortDir } from "@/lib/listQuery"

const MILL_SORT_KEYS = ["name", "ownerName", "createdAt"] as const
type MillSortKey = (typeof MILL_SORT_KEYS)[number]

function millOrderBy(sort: MillSortKey, dir: SortDir) {
  const primary: Record<MillSortKey, Prisma.MillOrderByWithRelationInput> = {
    name: { name: dir },
    ownerName: { ownerName: dir },
    createdAt: { createdAt: dir },
  }
  return withTiebreak(primary[sort], dir)
}

const millSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  ownerName: z.string().min(2, "Owner name must be at least 2 characters"),
  phone: z.string().optional().nullable(),
  email: z.string().email("Invalid email").optional().or(z.literal("")).nullable(),
  address: z.string().optional().nullable(),
})

export type MillFormValues = z.infer<typeof millSchema>

// Helper to check if user is admin
async function checkAdmin() {
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") {
    throw new Error("Unauthorized: Only Admins can perform this action")
  }
}

export async function createMill(data: MillFormValues) {
  await checkAdmin()

  const parsedData = millSchema.parse(data)

  const mill = await prisma.mill.create({
    data: {
      name: parsedData.name,
      ownerName: parsedData.ownerName,
      phone: parsedData.phone || null,
      email: parsedData.email || null,
      address: parsedData.address || null,
    },
  })

  revalidatePath("/dashboard/mills")
  return mill
}

export async function updateMill(id: string, data: MillFormValues) {
  await checkAdmin()

  const parsedData = millSchema.parse(data)

  const mill = await prisma.mill.update({
    where: { id },
    data: {
      name: parsedData.name,
      ownerName: parsedData.ownerName,
      phone: parsedData.phone || null,
      email: parsedData.email || null,
      address: parsedData.address || null,
    },
  })

  revalidatePath("/dashboard/mills")
  revalidatePath(`/dashboard/mills/${id}`)
  return mill
}

export async function softDeleteMill(id: string) {
  await checkAdmin()

  const mill = await prisma.mill.update({
    where: { id },
    data: {
      isActive: false,
    },
  })

  revalidatePath("/dashboard/mills")
  return mill
}

export async function getMills(params: {
  search?: string
  page?: string
  sort?: string
  dir?: string
} = {}) {
  // Allow all logged in users to view? The requirement says "Admin only" for permissions.
  // Let's protect the read action as well.
  await checkAdmin()

  const whereClause: Prisma.MillWhereInput = {
    isActive: true,
  }

  if (params.search) {
    whereClause.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { ownerName: { contains: params.search, mode: "insensitive" } },
    ]
  }

  const { sort, dir } = parseListQuery(params, {
    allowedSorts: MILL_SORT_KEYS,
    defaultSort: "createdAt",
    defaultDir: "desc",
  })
  const orderBy = millOrderBy(sort, dir)

  const result = await paginate(
    () => prisma.mill.count({ where: whereClause }),
    ({ skip, take }) => prisma.mill.findMany({ where: whereClause, orderBy, skip, take }),
    Number(params.page) || 1,
  )

  return { ...result, sort, dir }
}

export async function getMill(id: string) {
  await checkAdmin()

  return await prisma.mill.findUnique({
    where: { id },
  })
}
