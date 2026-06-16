import { PaddyLotForm } from "@/components/lots/PaddyLotForm"
import { getMillsForDropdown, getPaddyLot } from "@/actions/paddyLots"
import { FileText } from "lucide-react"
import { notFound } from "next/navigation"

export default async function EditLotPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [lot, mills] = await Promise.all([
    getPaddyLot(id),
    getMillsForDropdown()
  ])

  if (!lot) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <FileText className="h-6 w-6 text-emerald-600" />
        <h1 className="text-3xl font-bold tracking-tight">Edit Paddy Lot</h1>
      </div>
      <PaddyLotForm initialData={lot} lotId={lot.id} mills={mills} />
    </div>
  )
}
