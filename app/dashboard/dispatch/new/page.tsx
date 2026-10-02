import Link from "next/link"
import { getDispatchSetup } from "@/actions/dispatch"
import { ArrowLeft, Truck } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DispatchForm } from "@/components/dispatch/DispatchForm"

export default async function NewDispatchPage() {
  const [sales, godowns] = await getDispatchSetup()
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/dispatch"
          className={buttonVariants({ variant: "outline", size: "icon" })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Dispatch</h1>
          <p className="mt-1 text-muted-foreground">
            Fulfil a sales invoice from a godown and track delivery.
          </p>
        </div>
      </div>
      <Card className="max-w-5xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-violet-600" />
            Dispatch Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DispatchForm sales={sales} godowns={godowns} />
        </CardContent>
      </Card>
    </div>
  )
}
