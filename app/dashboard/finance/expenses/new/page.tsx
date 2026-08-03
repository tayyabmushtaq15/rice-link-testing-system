import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getAllCategories } from "@/actions/finance/categories"
import { ExpenseForm } from "@/components/finance/expenses/ExpenseForm"
import { getPaddyLotsForSelect } from "@/actions/finance/lotPosting"
import { getEmployees } from "@/actions/finance/employees"

export default async function NewExpensePage() {
  const session = await auth()
  const allowedRoles = ["ADMIN", "FINANCE_MANAGER"]

  if (!session?.user?.role || !allowedRoles.includes(session.user.role as string)) {
    redirect("/dashboard")
  }

  const [categories, lots, employees] = await Promise.all([
    getAllCategories(false),
    getPaddyLotsForSelect(),
    getEmployees(),
  ])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Record Expense</h1>
        <p className="text-sm text-muted-foreground">
          Add a new expense. Optionally link an employee to prefill name and basic salary.
        </p>
      </div>
      <ExpenseForm
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        lots={lots}
        employees={employees.map((e) => ({
          id: e.id,
          name: e.name,
          basicSalary: e.basicSalary,
        }))}
      />
    </div>
  )
}
