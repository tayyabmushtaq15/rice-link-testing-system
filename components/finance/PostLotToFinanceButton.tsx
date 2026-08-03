"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { postLotToFinance } from "@/actions/finance/lotPosting"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Upload } from "lucide-react"

interface PostLotToFinanceButtonProps {
  paddyLotId: string
  alreadyPosted?: boolean
  size?: "default" | "sm" | "lg" | "icon"
}

export function PostLotToFinanceButton({
  paddyLotId,
  alreadyPosted = false,
  size = "sm",
}: PostLotToFinanceButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [posted, setPosted] = useState(alreadyPosted)

  const handlePost = async () => {
    if (posted) return
    if (!confirm("Post this lot's production costs and expected sales to finance?")) return
    setLoading(true)
    setError("")
    try {
      await postLotToFinance(paddyLotId)
      setPosted(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post lot")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-1">
      {posted ? (
        <Button size={size} variant="outline" disabled>
          <CheckCircle2 className="mr-1 h-4 w-4 text-emerald-600" />
          Posted
        </Button>
      ) : (
        <Button
          size={size}
          className="bg-emerald-600 hover:bg-emerald-700"
          disabled={loading}
          onClick={handlePost}
        >
          <Upload className="mr-1 h-4 w-4" />
          {loading ? "Posting..." : "Post to Finance"}
        </Button>
      )}
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  )
}
