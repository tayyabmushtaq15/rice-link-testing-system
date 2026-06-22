import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ClipboardList, Pencil } from "lucide-react"

import { getReport } from "@/actions/reports"
import { ReportPdfActions } from "@/components/reports/ReportPdfActions"
import type { ReportPdfData } from "@/components/reports/ReportPdfDocument"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

function getStatusClass(status: string) {
  if (status === "DRAFT") return "bg-slate-100 text-slate-800 border-none"
  if (status === "SUBMITTED") return "bg-blue-100 text-blue-800 border-none"
  if (status === "APPROVED") return "bg-emerald-100 text-emerald-800 border-none"
  if (status === "REJECTED") return "bg-red-100 text-red-800 border-none"
  return ""
}

function formatReportNumber(id: string) {
  return `REP-${id.slice(0, 8).toUpperCase()}`
}

function formatDate(value?: Date | null) {
  return value ? value.toLocaleDateString() : "-"
}

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const report = await getReport(id)

  if (!report) {
    notFound()
  }

  const valuesByFieldId = new Map(
    report.values.map((value) => [value.templateFieldId, value.value])
  )
  const pdfReport: ReportPdfData = {
    id: report.id,
    reportNumber: formatReportNumber(report.id),
    reportTitle: report.template.name,
    partyName: report.paddyLot.supplierName,
    variety: report.paddyLot.variety,
    lotNumber: report.paddyLot.lotNumber,
    millName: report.paddyLot.mill.name,
    millOwnerName: report.paddyLot.mill.ownerName,
    analyst: report.analyst.name || report.analyst.email,
    qaApproval: report.approvedBy?.name || report.approvedBy?.email || "-",
    approvedAt: formatDate(report.approvedAt),
    submissionDate: formatDate(report.submissionDate),
    results: report.template.fields.map((field) => ({
      name: field.name,
      type: field.type,
      value: valuesByFieldId.get(field.id) || "-",
    })),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/reports" className={buttonVariants({ variant: "outline", size: "icon" })}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-3">
            <ClipboardList className="h-6 w-6 text-emerald-600" />
            <h1 className="text-3xl font-bold tracking-tight">{report.paddyLot.lotNumber}</h1>
            <Badge className={getStatusClass(report.status)}>
              {report.status}
            </Badge>
          </div>
        </div>
        {report.status === "DRAFT" && (
          <Link href={`/dashboard/reports/${report.id}/edit`} className={buttonVariants({ variant: "outline" })}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Draft
          </Link>
        )}
        {report.status === "APPROVED" && <ReportPdfActions report={pdfReport} />}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Report Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium">Template</p>
              <p className="text-muted-foreground">{report.template.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Analyst</p>
              <p className="text-muted-foreground">{report.analyst.name || report.analyst.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Submission Date</p>
              <p className="text-muted-foreground">
                {report.submissionDate ? report.submissionDate.toLocaleString() : "Not submitted"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lot Reference</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium">Lot Number</p>
              <Link href={`/dashboard/lots/${report.paddyLot.id}`} className="text-emerald-700 hover:underline">
                {report.paddyLot.lotNumber}
              </Link>
            </div>
            <div>
              <p className="text-sm font-medium">Mill</p>
              <p className="text-muted-foreground">{report.paddyLot.mill.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Supplier & Variety</p>
              <p className="text-muted-foreground">
                {report.paddyLot.supplierName} - {report.paddyLot.variety}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Report Values</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Field</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Required</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.template.fields.map((field) => (
                <TableRow key={field.id}>
                  <TableCell className="font-medium">{field.name}</TableCell>
                  <TableCell>{field.type}</TableCell>
                  <TableCell>{field.isRequired ? "Yes" : "No"}</TableCell>
                  <TableCell>{valuesByFieldId.get(field.id) || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
