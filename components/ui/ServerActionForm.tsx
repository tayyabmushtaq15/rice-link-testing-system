"use client"

import { useActionState } from "react"
import { unstable_rethrow } from "next/navigation"
import { AlertCircle } from "lucide-react"

type ServerActionFormProps = {
  action: (formData: FormData) => Promise<unknown>
  className?: string
  children: React.ReactNode
}

export function ServerActionForm({ action, className, children }: ServerActionFormProps) {
  const [error, formAction] = useActionState<string | null, FormData>(async (_prev, formData) => {
    try {
      await action(formData)
      return null
    } catch (err) {
      unstable_rethrow(err)
      return err instanceof Error ? err.message : "Something went wrong. Please try again."
    }
  }, null)

  return (
    <form action={formAction} className={className}>
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {children}
    </form>
  )
}
