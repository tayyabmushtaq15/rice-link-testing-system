import { TemplateForm } from "@/components/templates/TemplateForm"
import { LayoutTemplate } from "lucide-react"

export default function NewTemplatePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <LayoutTemplate className="h-6 w-6 text-emerald-600" />
        <h1 className="text-3xl font-bold tracking-tight">Create Report Template</h1>
      </div>
      <TemplateForm />
    </div>
  )
}
