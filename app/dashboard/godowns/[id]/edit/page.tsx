import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { getGodown, getUnits } from "@/actions/godowns"
import { GodownForm } from "@/components/godowns/GodownForm"

export default async function EditGodownPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [godown, units] = await Promise.all([getGodown(id), getUnits()])
  if (!godown || !godown.isActive) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/godowns"
          className={buttonVariants({ variant: "outline", size: "icon" })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Edit Godown</h1>
      </div>
      <GodownForm
        initialData={{
          id: godown.id,
          name: godown.name,
          location: godown.location,
          capacity: godown.capacity.toString(),
          unitId: godown.unitId,
        }}
        units={units}
      />
    </div>
  )
}
