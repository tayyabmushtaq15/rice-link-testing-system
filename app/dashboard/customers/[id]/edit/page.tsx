import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { getCustomer } from "@/actions/customers"
import { CustomerForm } from "@/components/customers/CustomerForm"

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const customer = await getCustomer(id)
  if (!customer || !customer.isActive) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/customers"
          className={buttonVariants({ variant: "outline", size: "icon" })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Edit Customer</h1>
      </div>
      <CustomerForm initialData={customer} />
    </div>
  )
}
