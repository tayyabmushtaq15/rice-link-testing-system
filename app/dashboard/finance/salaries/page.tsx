import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default async function FinanceSalariesPage() {
  const session = await auth()
  const allowedRoles = ["ADMIN", "FINANCE_MANAGER"]

  if (!session?.user?.role || !allowedRoles.includes(session.user.role as string)) {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Salary Management</h1>
          <p className="text-sm text-muted-foreground">Manage employee payroll and salary slips.</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Salary Record
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Salary records</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Salary entries, payment status, and printable slips will be managed here.</p>
        </CardContent>
      </Card>
    </div>
  )
}
