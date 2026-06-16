import { PaddyLotForm } from "@/components/lots/PaddyLotForm"
import { getMillsForDropdown } from "@/actions/paddyLots"
import { FileText } from "lucide-react"

export default async function NewLotPage() {
  const mills = await getMillsForDropdown()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <FileText className="h-6 w-6 text-emerald-600" />
        <h1 className="text-3xl font-bold tracking-tight">Add New Paddy Lot</h1>
      </div>
      <PaddyLotForm mills={mills} />
    </div>
  )
}
