import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getSalaryById } from "@/actions/finance/salaries"
import { getEmployees } from "@/actions/finance/employees"
import { SalaryForm } from "@/components/finance/salaries/SalaryForm"

interface EditSalaryPageProps {
  params: { id: string }
}

export default async function EditSalaryPage({ params }: EditSalaryPageProps) {
  const session = await auth()
  if (!session?.user?.role || !["ADMIN", "FINANCE_MANAGER"].includes(session.user.role as string)) {
    redirect("/dashboard")
  }

  let salary
  try {
    salary = await getSalaryById(params.id)
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
        initialData={salary} 
        salaryId={params.id}
        employees={employees.map(e => ({ id: e.id, name: e.name, basicSalary: e.basicSalary }))}
      />
    </div>
  )
}
