import { auth } from "@/auth"

export default async function DashboardPage() {
  const session = await auth()

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Welcome, {session?.user?.name || "User"}!</h1>
      <p className="text-muted-foreground">
        This is the Rice Mill Production Intelligence Platform dashboard. You are logged in as a{" "}
        <span className="font-semibold text-emerald-600">{session?.user?.role || "User"}</span>.
      </p>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Placeholder cards for dashboard shell */}
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total Production</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">---</div>
            <p className="text-xs text-muted-foreground">Data not yet available</p>
          </div>
        </div>
        
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Quality Score</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">---</div>
            <p className="text-xs text-muted-foreground">Data not yet available</p>
          </div>
        </div>
      </div>
    </div>
  )
}
