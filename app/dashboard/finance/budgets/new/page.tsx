import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getCategories } from "@/actions/finance/categories"
import { BudgetForm } from "@/components/finance/budgets/BudgetForm"

export default async function NewBudgetPage() {
  const session = await auth()
  const allowedRoles = ["ADMIN", "FINANCE_MANAGER"]

  if (!session?.user?.role || !allowedRoles.includes(session.user.role as string)) {
    redirect("/dashboard")
  }

  const categories = await getCategories()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add Budget</h1>
        <p className="text-sm text-muted-foreground">
          Set a monthly spending limit for an expense category.
        </p>
      </div>
      <BudgetForm categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
    </div>
  )
}
