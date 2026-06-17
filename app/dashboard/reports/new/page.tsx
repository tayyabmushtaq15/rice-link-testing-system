import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { getReportEntryOptions } from "@/actions/reports"
import { ReportForm } from "@/components/reports/ReportForm"
import { buttonVariants } from "@/components/ui/button"

export default async function NewReportPage() {
  const { lots, templates } = await getReportEntryOptions()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/reports" className={buttonVariants({ variant: "outline", size: "icon" })}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">New Report Entry</h1>
      </div>

      <ReportForm lots={lots} templates={templates} />
    </div>
  )
}
