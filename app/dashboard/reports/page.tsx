import Link from "next/link"
import { ClipboardList, Eye, Plus } from "lucide-react"

import { getReports } from "@/actions/reports"
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

export default async function ReportsPage() {
  const reports = await getReports()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Report Entries</h1>
        <Link href="/dashboard/reports/new" className={buttonVariants({ className: "bg-emerald-600 hover:bg-emerald-700" })}>
          <Plus className="mr-2 h-4 w-4" />
          New Report
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-emerald-600" />
            Recent Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lot Number</TableHead>
                <TableHead>Mill</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Values</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submission Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No report entries found.
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium text-emerald-700">
                      <Link href={`/dashboard/reports/${report.id}`} className="hover:underline">
                        {report.paddyLot.lotNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{report.paddyLot.mill.name}</TableCell>
                    <TableCell>{report.template.name}</TableCell>
                    <TableCell>{report._count.values}</TableCell>
                    <TableCell>
                      <Badge className={getStatusClass(report.status)}>
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {report.submissionDate ? report.submissionDate.toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/reports/${report.id}`} className={buttonVariants({ variant: "ghost", size: "icon" })}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
