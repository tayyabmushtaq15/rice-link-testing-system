import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getCategoryById } from "@/actions/finance/categories"
import { CategoryForm } from "@/components/finance/categories/CategoryForm"

interface EditCategoryPageProps {
  params: {
    id: string
  }
}

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const session = await auth()
  const allowedRoles = ["ADMIN", "FINANCE_MANAGER"]

  if (!session?.user?.role || !allowedRoles.includes(session.user.role as string)) {
    redirect("/dashboard")
  }

  let category
  try {
    category = await getCategoryById(params.id)
  } catch (error) {
    redirect("/dashboard/finance/categories")
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Category</h1>
        <p className="text-sm text-muted-foreground">Update the category details.</p>
      </div>
      <CategoryForm 
        initialData={category} 
        categoryId={params.id}
      />
    </div>
  )
}
