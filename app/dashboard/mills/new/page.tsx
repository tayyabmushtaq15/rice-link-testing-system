import { MillForm } from "@/components/mills/MillForm"
import { Building2 } from "lucide-react"

export default function NewMillPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Building2 className="h-6 w-6 text-emerald-600" />
        <h1 className="text-3xl font-bold tracking-tight">Add New Mill</h1>
      </div>
      <MillForm />
    </div>
  )
}
