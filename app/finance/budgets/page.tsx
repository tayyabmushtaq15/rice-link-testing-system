import { redirect } from "next/navigation"

export default function FinanceBudgetsLegacyRedirectPage() {
  redirect("/dashboard/finance/budgets")
}
