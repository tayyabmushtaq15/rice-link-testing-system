import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getExpenseById } from "@/actions/finance/expenses"
import { getAllCategories } from "@/actions/finance/categories"
import { ExpenseForm } from "@/components/finance/expenses/ExpenseForm"
import { getPaddyLotsForSelect } from "@/actions/finance/lotPosting"
import { getEmployees } from "@/actions/finance/employees"

export default async function EditExpensePage({
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
  let expense
  try {
    expense = await getExpenseById(id)
  } catch {
    redirect("/dashboard/finance/expenses")
  }

  const [categories, lots, employees] = await Promise.all([
    getAllCategories(false),
    getPaddyLotsForSelect(),
    getEmployees(true),
  ])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Expense</h1>
        <p className="text-sm text-muted-foreground">Update the expense transaction details.</p>
      </div>
      <ExpenseForm
        initialData={{
          id: expense.id,
          transactionNo: expense.transactionNo,
          date: expense.date,
          categoryId: expense.categoryId,
          category: { id: expense.category.id, name: expense.category.name },
          vendorName: expense.vendorName || "",
          description: expense.description || "",
          amount: expense.amount,
          paymentMethod: expense.paymentMethod,
          invoiceNumber: expense.invoiceNumber || "",
          attachment: expense.attachment || "",
          notes: expense.notes || "",
          paddyLotId: expense.paddyLotId || "",
          employeeId: expense.employeeId || "",
        }}
        expenseId={id}
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
