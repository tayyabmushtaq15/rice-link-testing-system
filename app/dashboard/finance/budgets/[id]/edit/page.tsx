import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getBudgetById } from "@/actions/finance/budgets"
import { getCategories } from "@/actions/finance/categories"
import { BudgetForm } from "@/components/finance/budgets/BudgetForm"

export default async function EditBudgetPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  const allowedRoles = ["ADMIN", "FINANCE_MANAGER"]

  if (!session?.user?.role || !allowedRoles.includes(session.user.role as string)) {
    redirect("/dashboard")
  }

  const { id } = await params
  const [budget, categories] = await Promise.all([getBudgetById(id), getCategories()])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Budget</h1>
        <p className="text-sm text-muted-foreground">
          Update the monthly limit for {budget.category.name}.
        </p>
      </div>
      <BudgetForm
        budgetId={budget.id}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        initialData={{
          id: budget.id,
          categoryId: budget.categoryId,
          month: budget.month,
          year: budget.year,
          budgetAmount: budget.budgetAmount,
        }}
      />
    </div>
  )
}
