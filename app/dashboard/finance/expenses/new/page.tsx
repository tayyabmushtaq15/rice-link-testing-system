import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getAllCategories } from "@/actions/finance/categories"
import { ExpenseForm } from "@/components/finance/expenses/ExpenseForm"

export default async function NewExpensePage() {
  const session = await auth()
  const allowedRoles = ["ADMIN", "FINANCE_MANAGER"]

  if (!session?.user?.role || !allowedRoles.includes(session.user.role as string)) {
    redirect("/dashboard")
  }

  const categories = await getAllCategories(false)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Record Expense</h1>
        <p className="text-sm text-muted-foreground">Add a new expense transaction to your financial records.</p>
      </div>
      <ExpenseForm categories={categories.map(c => ({ id: c.id, name: c.name }))} />
    </div>
  )
}
