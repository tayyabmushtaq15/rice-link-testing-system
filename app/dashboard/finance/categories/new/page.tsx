import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { CategoryForm } from "@/components/finance/categories/CategoryForm"

export default async function NewCategoryPage() {
  const session = await auth()
  const allowedRoles = ["ADMIN", "FINANCE_MANAGER"]

  if (!session?.user?.role || !allowedRoles.includes(session.user.role as string)) {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Category</h1>
        <p className="text-sm text-muted-foreground">Add a new expense category to organize your expenses.</p>
      </div>
      <CategoryForm />
    </div>
  )
}
