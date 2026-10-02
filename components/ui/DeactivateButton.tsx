"use client"

import { Button } from "@/components/ui/button"
import { Ban } from "lucide-react"
import { useTransition } from "react"

type DeactivateButtonProps = {
  itemName: string
  action: () => Promise<void>
}

export function DeactivateButton({ itemName, action }: DeactivateButtonProps) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="ghost"
      size="icon"
      title="Deactivate"
      onClick={() => {
        if (confirm(`Deactivate ${itemName}?`)) {
          startTransition(() => action())
        }
      }}
      disabled={isPending}
    >
      <Ban className="h-4 w-4" />
    </Button>
  )
}
