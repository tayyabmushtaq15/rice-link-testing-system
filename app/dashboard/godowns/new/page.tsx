import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { getUnits } from "@/actions/godowns"
import { GodownForm } from "@/components/godowns/GodownForm"

export default async function NewGodownPage() {
  const units = await getUnits()
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/godowns"
          className={buttonVariants({ variant: "outline", size: "icon" })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Add Godown</h1>
      </div>
      <GodownForm units={units} />
    </div>
  )
}
