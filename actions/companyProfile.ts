"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

async function requireAdmin() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim() || null
}

export async function getCompanyProfile() {
  await requireAdmin()
  return prisma.companyProfile.findFirst()
}

export async function saveCompanyProfile(formData: FormData) {
  await requireAdmin()
  const name = String(formData.get("name") || "").trim()
  if (name.length < 2) throw new Error("Company name is required")
  const existing = await prisma.companyProfile.findFirst()
  const data = {
    name,
    legalName: text(formData, "legalName"),
    businessType: text(formData, "businessType"),
    phone: text(formData, "phone"),
    email: text(formData, "email"),
    address: text(formData, "address"),
    city: text(formData, "city"),
    country: text(formData, "country") || "Pakistan",
    currency: String(formData.get("currency") || "PKR").trim(),
  }
  if (existing) await prisma.companyProfile.update({ where: { id: existing.id }, data })
  else await prisma.companyProfile.create({ data })
  revalidatePath("/dashboard/company")
}
