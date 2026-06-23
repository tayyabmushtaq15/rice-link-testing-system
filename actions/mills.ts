"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import type { Prisma } from "@prisma/client"

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
    }
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
    }
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
      isActive: false
    }
  })
  
  revalidatePath("/dashboard/mills")
  return mill
}

export async function getMills(search?: string) {
  // Allow all logged in users to view? The requirement says "Admin only" for permissions. 
  // Let's protect the read action as well.
  await checkAdmin()
  
  const whereClause: Prisma.MillWhereInput = {
    isActive: true
  }
  
  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { ownerName: { contains: search, mode: "insensitive" } }
    ]
  }
  
  return await prisma.mill.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" }
  })
}

export async function getMill(id: string) {
  await checkAdmin()
  
  return await prisma.mill.findUnique({
    where: { id }
  })
}
