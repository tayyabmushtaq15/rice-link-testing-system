"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Save, Send } from "lucide-react"

import { saveDraftReport, submitReportToQA } from "@/actions/reports"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const reportFormSchema = z.object({
  paddyLotId: z.string().min(1, "Paddy lot is required"),
  templateId: z.string().min(1, "Report template is required"),
  values: z.array(z.object({
    templateFieldId: z.string().min(1),
    value: z.string(),
  })),
})

type ReportFormValues = z.infer<typeof reportFormSchema>

type ReportLotOption = {
  id: string
  lotNumber: string
  supplierName: string
  variety: string
  mill: { name: string }
}

type ReportTemplateOption = {
  id: string
  name: string
  description: string | null
  fields: {
    id: string
    name: string
    type: "NUMBER" | "PERCENTAGE" | "TEXT"
    isRequired: boolean
    orderIndex: number
  }[]
}

type ReportInitialData = {
  id: string
  paddyLotId: string
  templateId: string
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED"
  values: {
    templateFieldId: string
    value: string
  }[]
}

interface ReportFormProps {
  lots: ReportLotOption[]
  templates: ReportTemplateOption[]
  initialData?: ReportInitialData
}

function getFieldInputType(type: "NUMBER" | "PERCENTAGE" | "TEXT") {
  return type === "TEXT" ? "text" : "number"
}

function getStep(type: "NUMBER" | "PERCENTAGE" | "TEXT") {
  return type === "TEXT" ? undefined : "0.01"
}

function buildValuesForTemplate(template?: ReportTemplateOption, initialData?: ReportInitialData) {
  return (template?.fields ?? []).map((field) => ({
    templateFieldId: field.id,
    value: initialData?.values.find((value) => value.templateFieldId === field.id)?.value ?? "",
  }))
}

export function ReportForm({ lots, templates, initialData }: ReportFormProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditable = !initialData || initialData.status === "DRAFT"
  const initialTemplate = templates.find((template) => template.id === initialData?.templateId)

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      paddyLotId: initialData?.paddyLotId ?? "",
      templateId: initialData?.templateId ?? "",
      values: buildValuesForTemplate(initialTemplate, initialData),
    },
  })

  const selectedTemplateId = form.watch("templateId")
  const selectedLotId = form.watch("paddyLotId")
  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId),
    [selectedTemplateId, templates]
  )

  useEffect(() => {
    form.setValue("values", buildValuesForTemplate(selectedTemplate, initialData), {
      shouldDirty: false,
      shouldValidate: true,
    })
  }, [form, initialData, selectedTemplate])

  async function handleSaveDraft(data: ReportFormValues) {
    setIsSaving(true)
    try {
      const report = await saveDraftReport(data, initialData?.id)
      router.push(`/dashboard/reports/${report.id}`)
      router.refresh()
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : "Something went wrong.")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSubmitToQA(data: ReportFormValues) {
    setIsSubmitting(true)
    try {
      const report = await submitReportToQA(data, initialData?.id)
      router.push(`/dashboard/reports/${report.id}`)
      router.refresh()
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : "Something went wrong.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form className="space-y-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>{initialData ? "Edit Report Entry" : "New Report Entry"}</CardTitle>
            <CardDescription>
              Select a lot and template to generate the quality report fields.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="paddyLotId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paddy Lot</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!isEditable}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a paddy lot">
                          {selectedLotId
                            ? lots.find((lot) => lot.id === selectedLotId)?.lotNumber
                            : "Select a paddy lot"}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {lots.map((lot) => (
                        <SelectItem key={lot.id} value={lot.id}>
                          {lot.lotNumber} - {lot.mill.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="templateId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Report Template</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!isEditable}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a template">
                          {selectedTemplate?.name ?? "Select a template"}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Report Values</CardTitle>
            <CardDescription>
              Fields are generated from the selected report template.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedTemplate ? (
              <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">
                Select a report template to enter values.
              </div>
            ) : selectedTemplate.fields.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">
                The selected template has no fields.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedTemplate.fields.map((templateField, index) => (
                  <FormField
                    key={templateField.id}
                    control={form.control}
                    name={`values.${index}.value`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {templateField.name}
                          {templateField.isRequired && <span className="text-destructive"> *</span>}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type={getFieldInputType(templateField.type)}
                            step={getStep(templateField.type)}
                            min={templateField.type === "PERCENTAGE" ? 0 : undefined}
                            max={templateField.type === "PERCENTAGE" ? 100 : undefined}
                            placeholder={templateField.type === "TEXT" ? "Enter value" : "0.00"}
                            disabled={!isEditable}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          {isEditable && (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={isSaving || isSubmitting}
                onClick={form.handleSubmit(handleSaveDraft)}
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Save Draft"}
              </Button>
              <Button
                type="button"
                disabled={isSaving || isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={form.handleSubmit(handleSubmitToQA)}
              >
                <Send className="mr-2 h-4 w-4" />
                {isSubmitting ? "Submitting..." : "Submit To QA"}
              </Button>
            </>
          )}
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSaving || isSubmitting}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
