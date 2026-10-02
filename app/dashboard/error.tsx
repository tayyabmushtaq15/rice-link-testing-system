"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, RotateCcw } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <CardTitle>Something went wrong</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {error.message || "An unexpected error occurred."}
          </p>
          <div className="flex gap-3">
            <Button onClick={reset} className="bg-emerald-600 hover:bg-emerald-700">
              <RotateCcw className="mr-2 h-4 w-4" />
              Try again
            </Button>
            <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
              Back to dashboard
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
