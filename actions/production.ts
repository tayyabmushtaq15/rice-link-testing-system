"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import {
  productionOutputSchema,
  type ProductionOutputFormValues,
} from "@/lib/production"
import { revalidatePath } from "next/cache"

async function checkProductionPermission() {
  const session = await auth()
  if (!session || !["ADMIN", "ANALYST"].includes(session.user?.role as string)) {
    throw new Error("Unauthorized: You do not have permission to manage production output")
  }
}

export async function upsertProductionOutput(
  paddyLotId: string,
  data: ProductionOutputFormValues
) {
  await checkProductionPermission()

  const parsedData = productionOutputSchema.parse(data)
  const lot = await prisma.paddyLot.findUnique({
    where: { id: paddyLotId },
    select: { id: true },
  })

  if (!lot) {
    throw new Error("Paddy lot not found")
  }

  const output = await prisma.productionOutput.upsert({
    where: { paddyLotId },
    create: {
      paddyLotId,
      ...parsedData,
    },
    update: parsedData,
  })

  revalidatePath("/dashboard/production")
  revalidatePath("/dashboard/lots")
  revalidatePath(`/dashboard/lots/${paddyLotId}`)

  return output
}

export async function getProductionLots() {
  await checkProductionPermission()

  return prisma.paddyLot.findMany({
    include: {
      mill: {
        select: { name: true },
      },
      productionOutput: true,
    },
    orderBy: { updatedAt: "desc" },
  })
}
