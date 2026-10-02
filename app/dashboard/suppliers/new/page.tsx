import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { SupplierForm } from "@/components/suppliers/SupplierForm"

export default function NewSupplierPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/suppliers"
          className={buttonVariants({ variant: "outline", size: "icon" })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Add Supplier</h1>
      </div>
      <SupplierForm />
    </div>
  )
}
