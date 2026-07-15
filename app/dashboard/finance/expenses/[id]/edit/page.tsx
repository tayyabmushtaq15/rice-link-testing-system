import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getExpenseById } from "@/actions/finance/expenses"
import { getAllCategories } from "@/actions/finance/categories"
import { ExpenseForm } from "@/components/finance/expenses/ExpenseForm"

interface EditExpensePageProps {
  params: {
    id: string
  }
}

export default async function EditExpensePage({ params }: EditExpensePageProps) {
  const session = await auth()
  const allowedRoles = ["ADMIN", "FINANCE_MANAGER"]

  if (!session?.user?.role || !allowedRoles.includes(session.user.role as string)) {
    redirect("/dashboard")
  }

  let expense
  try {
    expense = await getExpenseById(params.id)
  } catch (error) {
    redirect("/dashboard/finance/expenses")
  }

  const categories = await getAllCategories(false)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Expense</h1>
        <p className="text-sm text-muted-foreground">Update the expense transaction details.</p>
      </div>
      <ExpenseForm 
        initialData={expense} 
        expenseId={params.id}
        categories={categories.map(c => ({ id: c.id, name: c.name }))}
      />
    </div>
  )
}
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getExpenseById } from "@/actions/finance/expenses"
import { getAllCategories } from "@/actions/finance/categories"
import { ExpenseForm } from "@/components/finance/expenses/ExpenseForm"

interface EditExpensePageProps {
  params: {
    id: string
  }
}

export default async function EditExpensePage({ params }: EditExpensePageProps) {
  const session = await auth()
  const allowedRoles = ["ADMIN", "FINANCE_MANAGER"]

  if (!session?.user?.role || !allowedRoles.includes(session.user.role as string)) {
    redirect("/dashboard")
  }

  let expense
  try {
    expense = await getExpenseById(params.id)
  } catch (error) {
    redirect("/dashboard/finance/expenses")
  }

  const categories = await getAllCategories(false)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Expense</h1>
        <p className="text-sm text-muted-foreground">Update the expense transaction details.</p>
      </div>
      <ExpenseForm 
        initialData={expense} 
        expenseId={params.id}
        categories={categories.map(c => ({ id: c.id, name: c.name }))}
      />
    </div>
  )
}
