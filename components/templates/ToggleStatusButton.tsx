"use client"

import { Switch } from "@/components/ui/switch"
import { toggleTemplateStatus } from "@/actions/templates"
import { useTransition } from "react"
import { useRouter } from "next/navigation"

export function ToggleStatusButton({ id, isActive }: { id: string, isActive: boolean }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <Switch 
      checked={isActive}
      disabled={isPending}
      onCheckedChange={() => {
        startTransition(async () => {
          await toggleTemplateStatus(id)
          router.refresh()
        })
      }}
    />
  )
}
