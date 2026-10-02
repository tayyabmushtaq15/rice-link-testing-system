import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { getProductFormSetup } from "@/actions/products"
import { ProductForm } from "@/components/products/ProductForm"

export default async function NewProductPage() {
  const [categories, units] = await getProductFormSetup()
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/products"
          className={buttonVariants({ variant: "outline", size: "icon" })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Add Product</h1>
      </div>
      <ProductForm categories={categories} units={units} />
    </div>
  )
}
