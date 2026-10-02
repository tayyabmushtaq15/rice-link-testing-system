"use client"

import dynamic from "next/dynamic"

import type { DispatchPdfData } from "@/components/dispatch/DispatchPdfDocument"

const DispatchPdfActions = dynamic(
  () =>
    import("@/components/dispatch/DispatchPdfActions").then((module) => module.DispatchPdfActions),
  { ssr: false },
)

export function DispatchPdfActionsClient({
  dispatch,
  compact = false,
}: {
  dispatch: DispatchPdfData
  compact?: boolean
}) {
  return <DispatchPdfActions dispatch={dispatch} compact={compact} />
}
