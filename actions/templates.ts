"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { z } from "zod"
import { revalidatePath } from "next/cache"

const templateFieldSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Field name is required"),
  type: z.enum(["NUMBER", "PERCENTAGE", "TEXT"]),
  isRequired: z.boolean().default(true),
})

const reportTemplateSchema = z.object({
  name: z.string().min(2, "Template name must be at least 2 characters"),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  fields: z.array(templateFieldSchema).min(1, "At least one field is required"),
})

export type TemplateFieldFormValues = z.infer<typeof templateFieldSchema>
export type ReportTemplateFormValues = z.infer<typeof reportTemplateSchema>

async function checkAdmin() {
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") {
    throw new Error("Unauthorized: Only Admins can manage report templates")
  }
}

export async function createTemplate(data: ReportTemplateFormValues) {
  await checkAdmin()
  const parsedData = reportTemplateSchema.parse(data)
  
  const template = await prisma.reportTemplate.create({
    data: {
      name: parsedData.name,
      description: parsedData.description,
      isActive: parsedData.isActive,
      fields: {
        create: parsedData.fields.map((field, index) => ({
          name: field.name,
          type: field.type,
          isRequired: field.isRequired,
          orderIndex: index,
        }))
      }
    }
  })
  
  revalidatePath("/dashboard/templates")
  return template
}

export async function updateTemplate(id: string, data: ReportTemplateFormValues) {
  await checkAdmin()
  const parsedData = reportTemplateSchema.parse(data)
  
  // We will delete all existing fields and recreate them to ensure order and consistency
  const template = await prisma.$transaction(async (tx) => {
    await tx.templateField.deleteMany({
      where: { templateId: id }
    })
    
    return await tx.reportTemplate.update({
      where: { id },
      data: {
        name: parsedData.name,
        description: parsedData.description,
        isActive: parsedData.isActive,
        fields: {
          create: parsedData.fields.map((field, index) => ({
            name: field.name,
            type: field.type,
            isRequired: field.isRequired,
            orderIndex: index,
          }))
        }
      }
    })
  })
  
  revalidatePath("/dashboard/templates")
  revalidatePath(`/dashboard/templates/${id}`)
  return template
}

export async function toggleTemplateStatus(id: string) {
  await checkAdmin()
  
  const template = await prisma.reportTemplate.findUnique({ where: { id } })
  if (!template) throw new Error("Template not found")
    
  const updated = await prisma.reportTemplate.update({
    where: { id },
    data: { isActive: !template.isActive }
  })
  
  revalidatePath("/dashboard/templates")
  return updated
}

export async function getTemplates() {
  await checkAdmin()
  
  return await prisma.reportTemplate.findMany({
    include: {
      _count: {
        select: { fields: true }
      }
    },
    orderBy: { createdAt: "desc" }
  })
}

export async function getTemplate(id: string) {
  await checkAdmin()
  
  return await prisma.reportTemplate.findUnique({
    where: { id },
    include: {
      fields: {
        orderBy: { orderIndex: "asc" }
      }
    }
  })
}
