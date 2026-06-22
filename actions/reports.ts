"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const reportValueSchema = z.object({
  templateFieldId: z.string().min(1, "Template field is required"),
  value: z.string(),
})

const reportEntrySchema = z.object({
  paddyLotId: z.string().min(1, "Paddy lot is required"),
  templateId: z.string().min(1, "Report template is required"),
  values: z.array(reportValueSchema),
})

export type ReportEntryFormValues = z.infer<typeof reportEntrySchema>

async function getSessionUser() {
  const session = await auth()
  if (!session || !session.user?.role || !session.user.id) {
    throw new Error("Unauthorized: Please sign in")
  }

  return session.user
}

async function checkAnalystOrAdmin() {
  const user = await getSessionUser()
  if (!['ANALYST', 'ADMIN'].includes(user.role)) {
    throw new Error("Unauthorized: Only Analysts or Admins can manage reports")
  }

  return user
}

function validateFieldValue(
  value: string,
  field: { name: string; type: string; isRequired: boolean },
  requireValue: boolean
) {
  const trimmedValue = value.trim()

  if ((field.isRequired || requireValue) && !trimmedValue) {
    throw new Error(`${field.name} is required`)
  }

  if (!trimmedValue) return

  if (field.type === "NUMBER" || field.type === "PERCENTAGE") {
    const parsedValue = Number(trimmedValue)
    if (Number.isNaN(parsedValue)) {
      throw new Error(`${field.name} must be a valid number`)
    }

    if (field.type === "PERCENTAGE" && (parsedValue < 0 || parsedValue > 100)) {
      throw new Error(`${field.name} must be between 0 and 100`)
    }
  }
}

async function getValidatedReportPayload(data: ReportEntryFormValues, requireRequiredValues: boolean) {
  const parsedData = reportEntrySchema.parse(data)
  const template = await prisma.reportTemplate.findFirst({
    where: { id: parsedData.templateId, isActive: true },
    include: {
      fields: {
        orderBy: { orderIndex: "asc" },
      },
    },
  })

  if (!template) {
    throw new Error("Active report template not found")
  }

  const lot = await prisma.paddyLot.findUnique({
    where: { id: parsedData.paddyLotId },
    select: { id: true },
  })

  if (!lot) {
    throw new Error("Paddy lot not found")
  }

  const valuesByFieldId = new Map(
    parsedData.values.map((value) => [value.templateFieldId, value.value])
  )

  const values = template.fields.map((field) => {
    const value = valuesByFieldId.get(field.id) ?? ""
    validateFieldValue(value, field, requireRequiredValues)

    return {
      templateFieldId: field.id,
      value: value.trim(),
    }
  })

  return {
    paddyLotId: parsedData.paddyLotId,
    templateId: parsedData.templateId,
    values,
  }
}

async function assertEditableReport(reportId: string, user: { id: string; role: string }) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: { analystId: true, status: true },
  })

  if (!report) {
    throw new Error("Report not found")
  }

  if (user.role !== 'ADMIN' && report.analystId !== user.id) {
    throw new Error("Unauthorized: You can only manage your own reports")
  }

  if (report.status !== "DRAFT") {
    throw new Error("Only draft reports can be edited")
  }
}

export async function saveDraftReport(data: ReportEntryFormValues, reportId?: string) {
  const user = await checkAnalystOrAdmin()
  const payload = await getValidatedReportPayload(data, false)

  const report = await prisma.$transaction(async (tx) => {
    if (reportId) {
      await assertEditableReport(reportId, user)
      await tx.reportValue.deleteMany({ where: { reportId } })

      return tx.report.update({
        where: { id: reportId },
        data: {
          paddyLotId: payload.paddyLotId,
          templateId: payload.templateId,
          status: "DRAFT",
          submissionDate: null,
          values: {
            create: payload.values.map((value) => ({
              templateFieldId: value.templateFieldId,
              value: value.value,
            })),
          },
        },
      })
    }

    return tx.report.create({
      data: {
        paddyLotId: payload.paddyLotId,
        templateId: payload.templateId,
        analystId: user.id,
        status: "DRAFT",
        values: {
          create: payload.values.map((value) => ({
            templateFieldId: value.templateFieldId,
            value: value.value,
          })),
        },
      },
    })
  })

  revalidatePath("/dashboard/reports")
  revalidatePath(`/dashboard/reports/${report.id}`)
  return report
}

export async function submitReportToQA(data: ReportEntryFormValues, reportId?: string) {
  const user = await checkAnalystOrAdmin()
  const payload = await getValidatedReportPayload(data, true)

  const report = await prisma.$transaction(async (tx) => {
    if (reportId) {
      await assertEditableReport(reportId, user)
      await tx.reportValue.deleteMany({ where: { reportId } })

      return tx.report.update({
        where: { id: reportId },
        data: {
          paddyLotId: payload.paddyLotId,
          templateId: payload.templateId,
          status: "SUBMITTED",
          submissionDate: new Date(),
          values: {
            create: payload.values.map((value) => ({
              templateFieldId: value.templateFieldId,
              value: value.value,
            })),
          },
        },
      })
    }

    return tx.report.create({
      data: {
        paddyLotId: payload.paddyLotId,
        templateId: payload.templateId,
        analystId: user.id,
        status: "SUBMITTED",
        submissionDate: new Date(),
        values: {
          create: payload.values.map((value) => ({
            templateFieldId: value.templateFieldId,
            value: value.value,
          })),
        },
      },
    })
  })

  revalidatePath("/dashboard/reports")
  revalidatePath(`/dashboard/reports/${report.id}`)
  return report
}

export async function getReports() {
  const user = await checkAnalystOrAdmin()

  return prisma.report.findMany({
    where: user.role === 'ADMIN' ? undefined : { analystId: user.id },
    include: {
      paddyLot: {
        include: {
          mill: {
            select: { name: true },
          },
        },
      },
      template: {
        select: { name: true },
      },
      _count: {
        select: { values: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  })
}

export async function getReport(id: string) {
  const user = await checkAnalystOrAdmin()

  return prisma.report.findFirst({
    where: user.role === 'ADMIN' ? { id } : { id, analystId: user.id },
    include: {
      paddyLot: {
        include: {
          mill: true,
        },
      },
      template: {
        include: {
          fields: {
            orderBy: { orderIndex: "asc" },
          },
        },
      },
      analyst: {
        select: {
          name: true,
          email: true,
        },
      },
      approvedBy: {
        select: {
          name: true,
          email: true,
        },
      },
      values: {
        include: {
          templateField: true,
        },
      },
    },
  })
}

export async function getReportEntryOptions() {
  await checkAnalystOrAdmin()

  const [lots, templates] = await Promise.all([
    prisma.paddyLot.findMany({
      select: {
        id: true,
        lotNumber: true,
        supplierName: true,
        variety: true,
        mill: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.reportTemplate.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        fields: {
          select: {
            id: true,
            name: true,
            type: true,
            isRequired: true,
            orderIndex: true,
          },
          orderBy: { orderIndex: "asc" },
        },
      },
      orderBy: { name: "asc" },
    }),
  ])

  return { lots, templates }
}
