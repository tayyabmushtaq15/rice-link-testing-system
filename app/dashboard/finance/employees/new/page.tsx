import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { EmployeeForm } from "@/components/finance/employees/EmployeeForm"

export default async function NewEmployeePage() {
  const session = await auth()
  const allowedRoles = ["ADMIN", "FINANCE_MANAGER"]

  if (!session?.user?.role || !allowedRoles.includes(session.user.role as string)) {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add Employee</h1>
        <p className="text-sm text-muted-foreground">
          Create a staff record. Basic salary is used when recording payroll.
        </p>
      </div>
      <EmployeeForm />
    </div>
  )
}
