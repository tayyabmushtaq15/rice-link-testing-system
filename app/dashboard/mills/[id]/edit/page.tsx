import { MillForm } from "@/components/mills/MillForm"
import { Building2 } from "lucide-react"
import { getMill } from "@/actions/mills"
import { notFound } from "next/navigation"

export default async function EditMillPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const mill = await getMill(id)

  if (!mill || !mill.isActive) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Building2 className="h-6 w-6 text-emerald-600" />
        <h1 className="text-3xl font-bold tracking-tight">Edit Mill</h1>
      </div>
      <MillForm initialData={mill} millId={mill.id} />
    </div>
  )
}
