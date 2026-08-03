import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getSalaryById } from "@/actions/finance/salaries"
import { getEmployees } from "@/actions/finance/employees"
import { SalaryForm } from "@/components/finance/salaries/SalaryForm"

export default async function EditSalaryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.role || !["ADMIN", "FINANCE_MANAGER"].includes(session.user.role as string)) {
    redirect("/dashboard")
  }

  const { id } = await params
  let salary
  try {
    salary = await getSalaryById(id)
  } catch {
    redirect("/dashboard/finance/salaries")
  }

  const employees = await getEmployees()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Salary Record</h1>
        <p className="text-sm text-muted-foreground">Update salary details.</p>
      </div>
      <SalaryForm
        initialData={{
          id: salary.id,
          employeeId: salary.employeeId,
          employee: {
            id: salary.employee.id,
            name: salary.employee.name,
            basicSalary: salary.employee.basicSalary,
          },
          month: salary.month,
          year: salary.year,
          basicSalary: salary.basicSalary,
          allowances: salary.allowances,
          deductions: salary.deductions,
          bonus: salary.bonus,
          overtime: salary.overtime,
          paymentStatus: salary.paymentStatus === "PAID" ? "PAID" : "PENDING",
          paymentDate: salary.paymentDate || undefined,
        }}
        salaryId={id}
        employees={employees.map((e) => ({
          id: e.id,
          name: e.name,
          basicSalary: e.basicSalary,
        }))}
      />
    </div>
  )
}
