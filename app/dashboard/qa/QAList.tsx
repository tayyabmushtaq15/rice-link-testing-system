"use client"

import { useState } from "react"
import { format } from "date-fns"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type QAReport = {
  id: string
  template?: { name?: string | null } | null
  paddyLot?: {
    lotNumber?: string | null
    mill?: { name?: string | null } | null
  } | null
  analyst?: { name?: string | null; email?: string | null } | null
  status?: string | null
  submissionDate?: string | Date | null
  approvedAt?: string | Date | null
  rejectionReason?: string | null
}

function getStatusMeta(status?: string | null) {
  switch (status) {
    case "APPROVED":
      return { label: "Approved", variant: "default" as const }
    case "REJECTED":
      return { label: "Rejected", variant: "destructive" as const }
    case "SUBMITTED":
    default:
      return { label: "Pending Review", variant: "secondary" as const }
  }
}

function formatDate(value?: string | Date | null) {
  if (!value) return "—"

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "—"

  return format(parsed, "MMM dd, yyyy")
}

export default function QAList({ reports }: { reports: QAReport[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function postAction(url: string, body: Record<string, unknown>) {
    setLoadingId(String(body.reportId))
    try {
      const res = await fetch(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error || "Action failed")

      window.location.reload()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error"
      alert(errorMessage)
    } finally {
      setLoadingId(null)
    }
  }

  const pendingCount = reports.filter((report) => report.status === "SUBMITTED").length
  const approvedCount = reports.filter((report) => report.status === "APPROVED").length
  const rejectedCount = reports.filter((report) => report.status === "REJECTED").length

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending reviews</CardTitle>
            <CardDescription>Reports waiting for QA action</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{pendingCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CardDescription>Reports already cleared by QA</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{approvedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <CardDescription>Reports sent back with a reason</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{rejectedCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>QA review queue</CardTitle>
            <CardDescription>
              Submitted reports are actionable, while approved and rejected reports remain visible for audit tracking.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              No reports are currently available for QA review.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report</TableHead>
                  <TableHead>Mill / Lot</TableHead>
                  <TableHead>Analyst</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => {
                  const statusMeta = getStatusMeta(report.status)

                  return (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div className="font-medium">{report.template?.name ?? "Untitled report"}</div>
                        <div className="text-sm text-muted-foreground">{report.paddyLot?.lotNumber ?? "No lot assigned"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{report.paddyLot?.mill?.name ?? "Unknown mill"}</div>
                        <div className="text-sm text-muted-foreground">Lot {report.paddyLot?.lotNumber ?? "—"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{report.analyst?.name ?? "Unknown analyst"}</div>
                        <div className="text-sm text-muted-foreground">{report.analyst?.email ?? "—"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatDate(report.submissionDate)}</div>
                        <div className="text-sm text-muted-foreground">
                          {report.status === "SUBMITTED"
                            ? "Awaiting review"
                            : `Reviewed ${formatDate(report.approvedAt)}`}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {report.status === "SUBMITTED" ? (
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => postAction("/api/qa/approve", { reportId: report.id })}
                              disabled={loadingId === report.id}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const reason = window.prompt("Rejection reason:")
                                if (reason) {
                                  postAction("/api/qa/reject", { reportId: report.id, reason })
                                }
                              }}
                              disabled={loadingId === report.id}
                            >
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                const note = window.prompt("Return note (optional):")
                                postAction("/api/qa/return", { reportId: report.id, note })
                              }}
                              disabled={loadingId === report.id}
                            >
                              Return
                            </Button>
                          </div>
                        ) : (
                          <div className="max-w-48 text-sm text-muted-foreground">
                            {report.rejectionReason ? report.rejectionReason : "No further action required"}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
