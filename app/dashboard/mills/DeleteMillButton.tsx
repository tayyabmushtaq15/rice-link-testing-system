"use client"

import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { softDeleteMill } from "@/actions/mills"
import { useTransition } from "react"

export default function DeleteMillButton({ id, millName }: { id: string, millName: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button 
      variant="destructive" 
      size="icon" 
      onClick={() => {
        if (confirm(`Are you sure you want to delete ${millName}?`)) {
          startTransition(async () => {
            await softDeleteMill(id)
          })
        }
      }}
      disabled={isPending}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
