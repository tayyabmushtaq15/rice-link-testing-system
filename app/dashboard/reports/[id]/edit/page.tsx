import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { getReport, getReportEntryOptions } from "@/actions/reports"
import { ReportForm } from "@/components/reports/ReportForm"
import { buttonVariants } from "@/components/ui/button"

export default async function EditReportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [report, options] = await Promise.all([
    getReport(id),
    getReportEntryOptions(),
  ])

  if (!report) {
    notFound()
  }

  if (report.status !== "DRAFT") {
    redirect(`/dashboard/reports/${report.id}`)
  }

  const templates = options.templates.some((template) => template.id === report.templateId)
    ? options.templates
    : [
        ...options.templates,
        {
          id: report.template.id,
          name: report.template.name,
          description: report.template.description,
          fields: report.template.fields.map((field) => ({
            id: field.id,
            name: field.name,
            type: field.type,
            isRequired: field.isRequired,
            orderIndex: field.orderIndex,
          })),
        },
      ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/reports/${report.id}`} className={buttonVariants({ variant: "outline", size: "icon" })}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Edit Report Draft</h1>
      </div>

      <ReportForm
        lots={options.lots}
        templates={templates}
        initialData={{
          id: report.id,
          paddyLotId: report.paddyLotId,
          templateId: report.templateId,
          status: report.status,
          values: report.values.map((value) => ({
            templateFieldId: value.templateFieldId,
            value: value.value,
          })),
        }}
      />
    </div>
  )
}
