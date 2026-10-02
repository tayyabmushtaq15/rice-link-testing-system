import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { getSupplier } from "@/actions/suppliers"
import { SupplierForm } from "@/components/suppliers/SupplierForm"

export default async function EditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supplier = await getSupplier(id)
  if (!supplier || !supplier.isActive) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/suppliers"
          className={buttonVariants({ variant: "outline", size: "icon" })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Edit Supplier</h1>
      </div>
      <SupplierForm initialData={supplier} />
    </div>
  )
}
