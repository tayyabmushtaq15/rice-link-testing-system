import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getIncomeById } from "@/actions/finance/income"
import { IncomeForm } from "@/components/finance/income/IncomeForm"
import { getPaddyLotsForSelect } from "@/actions/finance/lotPosting"

export default async function EditIncomePage({
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
  let income
  try {
    income = await getIncomeById(id)
  } catch {
    redirect("/dashboard/finance/income")
  }

  const lots = await getPaddyLotsForSelect()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Income</h1>
        <p className="text-sm text-muted-foreground">Update the income transaction details.</p>
      </div>
      <IncomeForm
        initialData={{
          id: income.id,
          transactionNo: income.transactionNo,
          date: income.date,
          source: income.source,
          description: income.description || "",
          amount: income.amount,
          paymentMethod: income.paymentMethod,
          referenceNumber: income.referenceNumber || "",
          notes: income.notes || "",
          paddyLotId: income.paddyLotId || "",
        }}
        incomeId={id}
        lots={lots}
      />
    </div>
  )
}
