"use client"

import { useMemo } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export type TemplateFieldOption = {
  id: string
  name: string
  type: "NUMBER" | "PERCENTAGE" | "TEXT"
  section: string | null
  isRequired: boolean
  orderIndex: number
}

export type ReportTemplateOption = {
  id: string
  name: string
  description: string | null
  fields: TemplateFieldOption[]
}

function groupFieldsBySection(fields: TemplateFieldOption[]) {
  const groups = new Map<string, TemplateFieldOption[]>()
  for (const field of fields) {
    const key = field.section || ""
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(field)
  }
  return [...groups.entries()]
}

export function ReportTemplateSection({
  template,
  open,
  onToggle,
  values,
  onChange,
}: {
  template: ReportTemplateOption
  open: boolean
  onToggle: () => void
  values: Record<string, string>
  onChange: (fieldId: string, value: string) => void
}) {
  const sections = useMemo(() => groupFieldsBySection(template.fields), [template.fields])

  return (
    <div className="rounded-lg border">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between p-3 text-left text-sm font-medium"
      >
        <span className="flex items-center gap-2">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          {template.name}
        </span>
        <span className="text-xs font-normal text-muted-foreground">
          {open ? "Filling in" : "Click to fill in"}
        </span>
      </button>
      {open && (
        <div className="space-y-4 border-t p-4">
          {template.description && (
            <p className="text-xs text-muted-foreground">{template.description}</p>
          )}
          {sections.map(([section, fields]) => (
            <div key={section || "_default"}>
              {section && (
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                  {section}
                </p>
              )}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {fields.map((field) => (
                  <div key={field.id}>
                    <Label htmlFor={`f-${field.id}`} className="text-xs">
                      {field.name}
                      {field.isRequired && <span className="text-red-600"> *</span>}
                    </Label>
                    <Input
                      id={`f-${field.id}`}
                      type={field.type === "TEXT" ? "text" : "number"}
                      step={field.type === "TEXT" ? undefined : "0.01"}
                      min={field.type === "PERCENTAGE" ? 0 : undefined}
                      max={field.type === "PERCENTAGE" ? 100 : undefined}
                      value={values[field.id] || ""}
                      onChange={(event) => onChange(field.id, event.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
