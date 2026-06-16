import { TemplateForm } from "@/components/templates/TemplateForm"
import { getTemplate } from "@/actions/templates"
import { LayoutTemplate } from "lucide-react"
import { notFound } from "next/navigation"

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const template = await getTemplate(id)

  if (!template) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <LayoutTemplate className="h-6 w-6 text-emerald-600" />
        <h1 className="text-3xl font-bold tracking-tight">Edit Template: {template.name}</h1>
      </div>
      <TemplateForm initialData={template} templateId={template.id} />
    </div>
  )
}
