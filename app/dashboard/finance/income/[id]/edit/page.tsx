import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getIncomeById } from "@/actions/finance/income"
import { IncomeForm } from "@/components/finance/income/IncomeForm"

interface EditIncomePageProps {
  params: {
    id: string
  }
}

export default async function EditIncomePage({ params }: EditIncomePageProps) {
  const session = await auth()
  const allowedRoles = ["ADMIN", "FINANCE_MANAGER"]

  if (!session?.user?.role || !allowedRoles.includes(session.user.role as string)) {
    redirect("/dashboard")
  }

  let income
  try {
    income = await getIncomeById(params.id)
  } catch (error) {
    redirect("/dashboard/finance/income")
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Income</h1>
        <p className="text-sm text-muted-foreground">Update the income transaction details.</p>
      </div>
      <IncomeForm 
        initialData={income} 
        incomeId={params.id}
      />
    </div>
  )
}
