import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { IncomeForm } from "@/components/finance/income/IncomeForm"

export default async function NewIncomePage() {
  const session = await auth()
  const allowedRoles = ["ADMIN", "FINANCE_MANAGER"]

  if (!session?.user?.role || !allowedRoles.includes(session.user.role as string)) {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Record Income</h1>
        <p className="text-sm text-muted-foreground">Add a new income transaction to your financial records.</p>
      </div>
      <IncomeForm />
    </div>
  )
}
