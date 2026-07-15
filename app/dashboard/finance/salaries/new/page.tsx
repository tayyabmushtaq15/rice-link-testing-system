import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getEmployees } from "@/actions/finance/employees"
import { SalaryForm } from "@/components/finance/salaries/SalaryForm"

export default async function NewSalaryPage() {
  const session = await auth()
  if (!session?.user?.role || !["ADMIN", "FINANCE_MANAGER"].includes(session.user.role as string)) {
    redirect("/dashboard")
  }

  const employees = await getEmployees()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Record Salary</h1>
        <p className="text-sm text-muted-foreground">Add a new salary record for an employee.</p>
      </div>
      <SalaryForm employees={employees.map(e => ({ id: e.id, name: e.name, basicSalary: e.basicSalary }))} />
    </div>
  )
}
