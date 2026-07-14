import { auth } from "@/auth"
import { getDashboardOverview } from "@/actions/dashboard"
import { OwnerDashboard } from "@/components/dashboard/OwnerDashboard"

export default async function DashboardPage() {
  const session = await auth()
  const data = await getDashboardOverview()

  return (
    <OwnerDashboard
      data={data}
      ownerName={session?.user?.name || "Owner"}
    />
  )
}
