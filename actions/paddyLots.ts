"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { z } from "zod"
import { revalidatePath } from "next/cache"

const paddyLotSchema = z.object({
  millId: z.string().min(1, "Mill is required"),
  supplierName: z.string().min(2, "Supplier name must be at least 2 characters"),
  variety: z.string().min(2, "Variety must be at least 2 characters"),
  cropYear: z.string().min(4, "Crop year is required"),
  purchaseDate: z.date({
    required_error: "Purchase date is required",
    invalid_type_error: "That's not a date!",
  }),
  weight: z.number().min(0.1, "Weight must be greater than 0"),
  moisture: z.number().min(0, "Moisture cannot be negative").max(100, "Moisture cannot exceed 100%"),
  purchaseRate: z.number().min(0, "Purchase rate cannot be negative"),
  status: z.enum(["OPEN", "PROCESSING", "COMPLETED"]).default("OPEN"),
})

export type PaddyLotFormValues = z.infer<typeof paddyLotSchema>

// Helper to check if user has permission (Admin or Analyst)
async function checkPermission() {
  const session = await auth()
  if (!session || !["ADMIN", "ANALYST"].includes(session.user?.role as string)) {
    throw new Error("Unauthorized: You do not have permission to perform this action")
  }
}

function generateLotNumber() {
  const date = new Date()
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `LOT-${yyyy}${mm}${dd}-${randomStr}`
}

export async function createPaddyLot(data: PaddyLotFormValues) {
  await checkPermission()
  const parsedData = paddyLotSchema.parse(data)
  
  const lot = await prisma.paddyLot.create({
    data: {
      lotNumber: generateLotNumber(),
      millId: parsedData.millId,
      supplierName: parsedData.supplierName,
      variety: parsedData.variety,
      cropYear: parsedData.cropYear,
      purchaseDate: parsedData.purchaseDate,
      weight: parsedData.weight,
      moisture: parsedData.moisture,
      purchaseRate: parsedData.purchaseRate,
      status: parsedData.status,
    }
  })
  
  revalidatePath("/dashboard/lots")
  return lot
}

export async function updatePaddyLot(id: string, data: PaddyLotFormValues) {
  await checkPermission()
  const parsedData = paddyLotSchema.parse(data)
  
  const lot = await prisma.paddyLot.update({
    where: { id },
    data: {
      millId: parsedData.millId,
      supplierName: parsedData.supplierName,
      variety: parsedData.variety,
      cropYear: parsedData.cropYear,
      purchaseDate: parsedData.purchaseDate,
      weight: parsedData.weight,
      moisture: parsedData.moisture,
      purchaseRate: parsedData.purchaseRate,
      status: parsedData.status,
    }
  })
  
  revalidatePath("/dashboard/lots")
  revalidatePath(`/dashboard/lots/${id}`)
  return lot
}

export async function getPaddyLots(search?: string, millId?: string) {
  await checkPermission()
  
  const whereClause: any = {}
  
  if (millId && millId !== "all") {
    whereClause.millId = millId
  }
  
  if (search) {
    whereClause.OR = [
      { lotNumber: { contains: search, mode: "insensitive" } },
      { supplierName: { contains: search, mode: "insensitive" } },
      { variety: { contains: search, mode: "insensitive" } }
    ]
  }
  
  return await prisma.paddyLot.findMany({
    where: whereClause,
    include: {
      mill: {
        select: { name: true }
      },
      productionOutput: true
    },
    orderBy: { createdAt: "desc" }
  })
}

export async function getPaddyLot(id: string) {
  await checkPermission()
  
  return await prisma.paddyLot.findUnique({
    where: { id },
    include: {
      mill: true,
      productionOutput: true
    }
  })
}

// Helper to fetch mills for the dropdown
export async function getMillsForDropdown() {
  await checkPermission()
  return await prisma.mill.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" }
  })
}
