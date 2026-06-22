"use client"

import { useMemo, useState } from "react"
import { BlobProvider, PDFDownloadLink } from "@react-pdf/renderer"
import { Download, Printer } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  ProductionPdfDocument,
  type ProductionPdfData,
} from "@/components/production/ProductionPdfDocument"

function getFileName(report: ProductionPdfData) {
  const safeReportNumber = report.reportNumber.replace(/[^a-z0-9-]/gi, "_")
  return `${safeReportNumber}_${report.lotNumber}.pdf`
}

function printPdf(url: string) {
  const iframe = document.createElement("iframe")
  iframe.style.position = "fixed"
  iframe.style.right = "0"
  iframe.style.bottom = "0"
  iframe.style.width = "0"
  iframe.style.height = "0"
  iframe.style.border = "0"
  iframe.src = url

  iframe.onload = () => {
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
  }

  document.body.appendChild(iframe)
  window.setTimeout(() => iframe.remove(), 60_000)
}

export function ProductionPdfActions({
  report,
  compact = false,
}: {
  report: ProductionPdfData
  compact?: boolean
}) {
  const [isPrinting, setIsPrinting] = useState(false)
  const document = useMemo(() => <ProductionPdfDocument report={report} />, [report])
  const fileName = getFileName(report)

  return (
    <div className="flex items-center justify-end gap-2">
      <PDFDownloadLink document={document} fileName={fileName}>
        {({ loading }) => (
          <Button
            variant="outline"
            size={compact ? "icon" : "default"}
            disabled={loading}
            title={compact ? "Download production PDF" : undefined}
          >
            <Download className={compact ? "h-4 w-4" : "mr-2 h-4 w-4"} />
            {!compact && (loading ? "Preparing" : "Download PDF")}
          </Button>
        )}
      </PDFDownloadLink>

      <BlobProvider document={document}>
        {({ url, loading, error }) => (
          <Button
            variant="outline"
            size={compact ? "icon" : "default"}
            disabled={!url || loading || isPrinting}
            onClick={() => {
              if (!url) return
              setIsPrinting(true)
              printPdf(url)
              window.setTimeout(() => setIsPrinting(false), 1000)
            }}
            title={error ? "PDF could not be prepared" : compact ? "Print production PDF" : undefined}
          >
            <Printer className={compact ? "h-4 w-4" : "mr-2 h-4 w-4"} />
            {!compact && (loading || isPrinting ? "Preparing" : "Print PDF")}
          </Button>
        )}
      </BlobProvider>
    </div>
  )
}
