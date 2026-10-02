import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { getProduct, getProductFormSetup } from "@/actions/products"
import { ProductForm } from "@/components/products/ProductForm"

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [product, [categories, units]] = await Promise.all([getProduct(id), getProductFormSetup()])
  if (!product || !product.isActive) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/products"
          className={buttonVariants({ variant: "outline", size: "icon" })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
      </div>
      <ProductForm initialData={product} categories={categories} units={units} />
    </div>
  )
}
