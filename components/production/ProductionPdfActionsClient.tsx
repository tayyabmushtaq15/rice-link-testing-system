"use client"

import dynamic from "next/dynamic"

import type { ProductionPdfData } from "@/components/production/ProductionPdfDocument"

const ProductionPdfActions = dynamic(
  () =>
    import("@/components/production/ProductionPdfActions").then(
      (module) => module.ProductionPdfActions,
    ),
  { ssr: false },
)

export function ProductionPdfActionsClient({
  report,
  compact = false,
}: {
  report: ProductionPdfData
  compact?: boolean
}) {
  return <ProductionPdfActions report={report} compact={compact} />
}
