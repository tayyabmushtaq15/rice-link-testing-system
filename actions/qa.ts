"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { paginate, parseListQuery, withTiebreak, type SortDir } from "@/lib/listQuery"
import type { Prisma } from "@prisma/client"

const QA_SORT_KEYS = ["submitted", "status"] as const
type QASortKey = (typeof QA_SORT_KEYS)[number]

function qaOrderBy(sort: QASortKey, dir: SortDir) {
  const primary: Record<QASortKey, Prisma.ReportOrderByWithRelationInput> = {
    submitted: { submissionDate: dir },
    status: { status: dir },
  }
  return withTiebreak(primary[sort], dir)
}

async function getSessionUser() {
  const session = await auth()
  if (!session || !session.user?.role || !session.user.id) {
    throw new Error("Unauthorized: Please sign in")
  }

  return session.user
}

async function checkQAOrAdmin() {
  const user = await getSessionUser()
  if (["QA", "ADMIN"].includes(user.role)) {
    return user
  }

  throw new Error("Unauthorized: Only QA or Admin users can perform this action")
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

export async function getSubmittedReports(params: { page?: string; sort?: string; dir?: string } = {}) {
  await checkQAOrAdmin()

  const whereClause: Prisma.ReportWhereInput = {
    status: {
      in: ["SUBMITTED", "APPROVED", "REJECTED"],
    },
  }

  const { sort, dir } = parseListQuery(params, {
    allowedSorts: QA_SORT_KEYS,
    defaultSort: "submitted",
    defaultDir: "desc",
  })
  const orderBy = qaOrderBy(sort, dir)

  // Status counts reflect the WHOLE filtered dataset (not just the current page), for the QA
  // dashboard's stat cards — computed from a groupBy alongside the paginated list.
  const [result, statusGroups] = await Promise.all([
    paginate(
      () => prisma.report.count({ where: whereClause }),
      ({ skip, take }) =>
        prisma.report.findMany({
          where: whereClause,
          include: {
            paddyLot: { include: { mill: true } },
            purchase: { select: { purchaseNo: true, supplier: { select: { name: true } } } },
            productionBatch: { select: { batchNo: true } },
            template: { select: { name: true } },
            analyst: { select: { id: true, name: true, email: true } },
            values: { include: { templateField: true } },
          },
          orderBy,
          skip,
          take,
        }),
      Number(params.page) || 1,
    ),
    prisma.report.groupBy({ by: ["status"], where: whereClause, _count: true }),
  ])

  const statusCounts = {
    pending: statusGroups.find((g) => g.status === "SUBMITTED")?._count ?? 0,
    approved: statusGroups.find((g) => g.status === "APPROVED")?._count ?? 0,
    rejected: statusGroups.find((g) => g.status === "REJECTED")?._count ?? 0,
  }

  return { ...result, sort, dir, statusCounts }
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
  await checkQAOrAdmin()
  const { reportId, note } = returnSchema.parse(data)

  const report = await prisma.report.findUnique({ where: { id: reportId } })
  if (!report) throw new Error("Report not found")
  if (report.status !== "SUBMITTED")
    throw new Error("Only submitted reports can be returned to analyst")

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
