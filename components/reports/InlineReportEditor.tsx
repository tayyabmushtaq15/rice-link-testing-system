"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  ReportTemplateSection,
  type ReportTemplateOption,
} from "@/components/reports/ReportTemplateSection"
import { submitExistingReport, updateReportValues } from "@/actions/reports"

export function InlineReportEditor({
  reportId,
  template,
  initialValues,
}: {
  reportId: string
  template: ReportTemplateOption
  initialValues: Record<string, string>
}) {
  const router = useRouter()
  const [open, setOpen] = useState(true)
  const [values, setValues] = useState<Record<string, string>>(initialValues)
  const [busy, setBusy] = useState<"save" | "submit" | null>(null)

  async function handle(action: "save" | "submit") {
    setBusy(action)
    try {
      const payload = template.fields.map((field) => ({
        templateFieldId: field.id,
        value: values[field.id] || "",
      }))
      if (action === "save") await updateReportValues(reportId, payload)
      else await submitExistingReport(reportId, payload)
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Something went wrong.")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-4">
      <ReportTemplateSection
        template={template}
        open={open}
        onToggle={() => setOpen((current) => !current)}
        values={values}
        onChange={(fieldId, value) => setValues((current) => ({ ...current, [fieldId]: value }))}
      />
      <div className="flex gap-3">
        <Button variant="outline" disabled={!!busy} onClick={() => handle("save")}>
          {busy === "save" ? "Saving..." : "Save"}
        </Button>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700"
          disabled={!!busy}
          onClick={() => handle("submit")}
        >
          {busy === "submit" ? "Submitting..." : "Submit to QA"}
        </Button>
      </div>
    </div>
  )
}
