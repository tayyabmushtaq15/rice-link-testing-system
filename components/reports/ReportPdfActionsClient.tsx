"use client"

import dynamic from "next/dynamic"

import type { ReportPdfData } from "@/components/reports/ReportPdfDocument"

const ReportPdfActions = dynamic(
  () => import("@/components/reports/ReportPdfActions").then((module) => module.ReportPdfActions),
  { ssr: false },
)

export function ReportPdfActionsClient({ report }: { report: ReportPdfData }) {
  return <ReportPdfActions report={report} />
}
