"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { z } from "zod"
import type { Prisma } from "@prisma/client"
import { paginate, parseListQuery, withTiebreak, type SortDir } from "@/lib/listQuery"

const USER_SORT_KEYS = ["name", "email", "role", "createdAt"] as const
type UserSortKey = (typeof USER_SORT_KEYS)[number]

function userOrderBy(sort: UserSortKey, dir: SortDir) {
  const primary: Record<UserSortKey, Prisma.UserOrderByWithRelationInput> = {
    name: { name: dir },
    email: { email: dir },
    role: { role: dir },
    createdAt: { createdAt: dir },
  }
  return withTiebreak(primary[sort], dir)
}

const userSchema = z.object({
  email: z.string().email("Invalid email"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["ADMIN", "ANALYST", "QA", "MILL_OWNER", "FINANCE_MANAGER"]),
})

const createUserSchema = userSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
})

const updateUserSchema = userSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
})

export type UserFormValues = z.infer<typeof createUserSchema>
export type UpdateUserFormValues = z.infer<typeof updateUserSchema>

async function checkAdmin() {
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN" || !session.user.id) {
    throw new Error("Unauthorized: Only Admins can manage users")
  }

  return session.user
}

export async function getUsers(params: {
  page?: string
  sort?: string
  dir?: string
} = {}) {
  await checkAdmin()

  const { sort, dir } = parseListQuery(params, {
    allowedSorts: USER_SORT_KEYS,
    defaultSort: "createdAt",
    defaultDir: "desc",
  })
  const orderBy = userOrderBy(sort, dir)

  const result = await paginate(
    () => prisma.user.count(),
    ({ skip, take }) =>
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
        orderBy,
        skip,
        take,
      }),
    Number(params.page) || 1,
  )

  return { ...result, sort, dir }
}

export async function getUser(id: string) {
  await checkAdmin()

  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  })
}

export async function createUser(data: UserFormValues) {
  await checkAdmin()
  const parsedData = createUserSchema.parse(data)

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: parsedData.email },
  })

  if (existingUser) {
    throw new Error("Email already in use")
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(parsedData.password, 10)

  const user = await prisma.user.create({
    data: {
      email: parsedData.email,
      name: parsedData.name,
      role: parsedData.role,
      password: hashedPassword,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  })

  revalidatePath("/dashboard/users")
  return user
}

export async function updateUser(id: string, data: UpdateUserFormValues) {
  const admin = await checkAdmin()
  const parsedData = updateUserSchema.parse(data)

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true },
  })

  if (!user) {
    throw new Error("User not found")
  }

  // Check if email is already in use by another user
  if (parsedData.email !== user.email) {
    const existingUser = await prisma.user.findUnique({
      where: { email: parsedData.email },
    })

    if (existingUser) {
      throw new Error("Email already in use")
    }
  }

  // Hash new password if provided
  const updateData: UpdateUserFormValues = {
    email: parsedData.email,
    name: parsedData.name,
    role: parsedData.role,
    ...(parsedData.password ? { password: await bcrypt.hash(parsedData.password, 10) } : {}),
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  })

  revalidatePath("/dashboard/users")
  revalidatePath(`/dashboard/users/${id}/edit`)
  return updatedUser
}

export async function deleteUser(id: string) {
  const admin = await checkAdmin()

  // Prevent self-deletion
  if (admin.id === id) {
    throw new Error("You cannot delete your own account")
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  })

  if (!user) {
    throw new Error("User not found")
  }

  await prisma.user.delete({
    where: { id },
  })

  revalidatePath("/dashboard/users")
  return { success: true }
}
