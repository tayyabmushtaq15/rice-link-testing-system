"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

async function getSessionUser() {
  const session = await auth()
  if (!session || !session.user?.role || !session.user.id) {
    throw new Error("Unauthorized: Please sign in")
  }

  return session.user
}

async function checkQAOrAdmin() {
  const user = await getSessionUser()
  if (!['QA', 'ADMIN'].includes(user.role)) {
    throw new Error("Unauthorized: Only QA or Admin users can perform this action")
  }

  return user
}

const approveSchema = z.object({
  reportId: z.string().min(1),
})

const rejectSchema = z.object({
  reportId: z.string().min(1),
  reason: z.string().min(1, "Rejection reason is required"),
})

const returnSchema = z.object({
  reportId: z.string().min(1),
  note: z.string().optional(),
})

export async function getSubmittedReports() {
  await checkQAOrAdmin()

  return prisma.report.findMany({
    where: { status: "SUBMITTED" },
    include: {
      paddyLot: { include: { mill: true } },
      template: { select: { name: true } },
      analyst: { select: { id: true, name: true, email: true } },
      values: { include: { templateField: true } },
    },
    orderBy: { submissionDate: "desc" },
  })
}

export async function approveReport(data: z.infer<typeof approveSchema>) {
  const user = await checkQAOrAdmin()
  const { reportId } = approveSchema.parse(data)

  const report = await prisma.report.findUnique({ where: { id: reportId } })
  if (!report) throw new Error("Report not found")
  if (report.status !== "SUBMITTED") throw new Error("Only submitted reports can be approved")

  const updated = await prisma.report.update({
    where: { id: reportId },
    data: {
      status: "APPROVED",
      approvedById: user.id,
      approvedAt: new Date(),
      rejectionReason: null,
    },
  })

  revalidatePath("/dashboard/reports")
  revalidatePath(`/dashboard/reports/${reportId}`)
  revalidatePath(`/dashboard/qa`)

  return updated
}

export async function rejectReport(data: z.infer<typeof rejectSchema>) {
  const user = await checkQAOrAdmin()
  const { reportId, reason } = rejectSchema.parse(data)

  const report = await prisma.report.findUnique({ where: { id: reportId } })
  if (!report) throw new Error("Report not found")
  if (report.status !== "SUBMITTED") throw new Error("Only submitted reports can be rejected")

  const updated = await prisma.report.update({
    where: { id: reportId },
    data: {
      status: "REJECTED",
      approvedById: user.id,
      approvedAt: new Date(),
      rejectionReason: reason,
    },
  })

  revalidatePath("/dashboard/reports")
  revalidatePath(`/dashboard/reports/${reportId}`)
  revalidatePath(`/dashboard/qa`)

  return updated
}

export async function returnToAnalyst(data: z.infer<typeof returnSchema>) {
  const user = await checkQAOrAdmin()
  const { reportId, note } = returnSchema.parse(data)

  const report = await prisma.report.findUnique({ where: { id: reportId } })
  if (!report) throw new Error("Report not found")
  if (report.status !== "SUBMITTED") throw new Error("Only submitted reports can be returned to analyst")

  const updated = await prisma.report.update({
    where: { id: reportId },
    data: {
      status: "DRAFT",
      submissionDate: null,
      approvedById: null,
      approvedAt: null,
      rejectionReason: note ?? null,
    },
  })

  revalidatePath("/dashboard/reports")
  revalidatePath(`/dashboard/reports/${reportId}`)
  revalidatePath(`/dashboard/qa`)

  return updated
}
