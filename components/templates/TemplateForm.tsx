"use client"

import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { createTemplate, updateTemplate } from "@/actions/templates"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Trash2, Plus, ArrowUp, ArrowDown } from "lucide-react"

const templateFieldSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Field name is required"),
  type: z.enum(["NUMBER", "PERCENTAGE", "TEXT"]),
  isRequired: z.boolean().default(true),
})

const reportTemplateSchema = z.object({
  name: z.string().min(2, "Template name must be at least 2 characters"),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  fields: z.array(templateFieldSchema).min(1, "At least one field is required"),
})

type ReportTemplateFormValues = z.infer<typeof reportTemplateSchema>
type ReportTemplateInitialData = Omit<ReportTemplateFormValues, "fields"> & {
  fields?: Array<ReportTemplateFormValues["fields"][number] & { id?: string }>
}

interface TemplateFormProps {
  initialData?: ReportTemplateInitialData
  templateId?: string
}

export function TemplateForm({ initialData, templateId }: TemplateFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ReportTemplateFormValues>({
    resolver: zodResolver(reportTemplateSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      isActive: initialData?.isActive ?? true,
      fields: initialData?.fields?.length ? initialData.fields : [
        { name: "", type: "NUMBER", isRequired: true }
      ],
    },
  })

  const { fields, append, remove, move } = useFieldArray({
    name: "fields",
    control: form.control,
  })

  async function onSubmit(data: ReportTemplateFormValues) {
    setIsSubmitting(true)
    try {
      if (initialData && templateId) {
        await updateTemplate(templateId, data)
      } else {
        await createTemplate(data)
      }
      router.push("/dashboard/templates")
    } catch (error) {
      console.error(error)
      alert("Something went wrong.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>{initialData ? "Edit Template" : "Create New Template"}</CardTitle>
            <CardDescription>
              Define the metadata for this report template.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Husker Report" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="What is this report used for?" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Enable or disable this template for new reports.
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Template Fields</CardTitle>
              <CardDescription>Define the dynamic fields required for this report.</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ name: "", type: "NUMBER", isRequired: true })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {form.formState.errors.fields?.root && (
              <p className="text-sm font-medium text-destructive">
                {form.formState.errors.fields.root.message}
              </p>
            )}
            
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-4 p-4 border rounded-md bg-slate-50">
                <div className="flex flex-col gap-1 mt-6">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    disabled={index === 0}
                    onClick={() => move(index, index - 1)}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    disabled={index === fields.length - 1}
                    onClick={() => move(index, index + 1)}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1">
                  <FormField
                    control={form.control}
                    name={`fields.${index}.name`}
                    render={({ field: nameField }) => (
                      <FormItem className="md:col-span-5">
                        <FormLabel>Field Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Paddy Broken" {...nameField} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name={`fields.${index}.type`}
                    render={({ field: typeField }) => (
                      <FormItem className="md:col-span-4">
                        <FormLabel>Data Type</FormLabel>
                        <Select onValueChange={typeField.onChange} value={typeField.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Select type">
                                {typeField.value === "NUMBER" ? "Number" : typeField.value === "PERCENTAGE" ? "Percentage" : "Text"}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="NUMBER">Number</SelectItem>
                            <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                            <SelectItem value="TEXT">Text</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`fields.${index}.isRequired`}
                    render={({ field: requiredField }) => (
                      <FormItem className="md:col-span-2 flex flex-col justify-end space-y-3 pb-2">
                        <FormLabel className="truncate">Required</FormLabel>
                        <FormControl>
                          <Switch
                            checked={requiredField.value}
                            onCheckedChange={requiredField.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="md:col-span-1 flex flex-col justify-end pb-1.5">
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="icon"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {fields.length === 0 && (
              <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">
                No fields added. Click &quot;Add Field&quot; to start.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
            {isSubmitting ? "Saving..." : "Save Template"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
