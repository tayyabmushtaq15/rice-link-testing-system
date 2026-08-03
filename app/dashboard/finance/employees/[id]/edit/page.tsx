import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getEmployeeById } from "@/actions/finance/employees"
import { EmployeeForm } from "@/components/finance/employees/EmployeeForm"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function EditEmployeePage({
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
  let employee
  try {
    employee = await getEmployeeById(id)
  } catch {
    redirect("/dashboard/finance/employees")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Employee</h1>
        <p className="text-sm text-muted-foreground">
          Update profile details used for salary and expense calculations.
        </p>
      </div>

      <EmployeeForm
        employeeId={employee.id}
        initialData={{
          id: employee.id,
          name: employee.name,
          department: employee.department,
          designation: employee.designation,
          basicSalary: employee.basicSalary,
          status: employee.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
        }}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent salaries</CardTitle>
          </CardHeader>
          <CardContent>
            {employee.salaries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No salary records yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {employee.salaries.map((s) => (
                  <li key={s.id} className="flex justify-between">
                    <span>
                      {s.month}/{s.year} · {s.paymentStatus}
                    </span>
                    <span className="font-medium">{formatCurrency(s.netSalary)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent linked expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {employee.expenses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No linked expenses yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {employee.expenses.map((e) => (
                  <li key={e.id} className="flex justify-between">
                    <span>
                      {e.category.name} · {new Date(e.date).toLocaleDateString()}
                    </span>
                    <span className="font-medium">{formatCurrency(e.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
