"use client"

import React, { useState } from "react"

type QAReport = {
  id: string
  template?: { name?: string }
  paddyLot?: { lotNumber?: string }
  analyst?: { name?: string; email?: string }
  status?: string
}

export default function QAList({ reports }: { reports: QAReport[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function postAction(url: string, body: Record<string, unknown>) {
    setLoadingId(String(body.reportId))
    try {
      const res = await fetch(url, { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error || "Action failed")
      // reload the page to refresh server data
      window.location.reload()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error"
      alert(errorMessage)
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {reports.length === 0 && <div>No submitted reports.</div>}
      {reports.map((r) => (
        <div key={r.id} className="p-4 border rounded">
          <div className="flex justify-between">
            <div>
              <div className="font-semibold">{r.template?.name} — {r.paddyLot?.lotNumber}</div>
              <div className="text-sm text-muted-foreground">Analyst: {r.analyst?.name} ({r.analyst?.email})</div>
              <div className="text-sm mt-2">Status: {r.status}</div>
            </div>
            <div className="space-x-2">
              <button className="btn" onClick={() => postAction('/api/qa/approve', { reportId: r.id })} disabled={loadingId === r.id}>Approve</button>
              <button className="btn" onClick={() => {
                const reason = prompt('Rejection reason:')
                if (reason) postAction('/api/qa/reject', { reportId: r.id, reason })
              }} disabled={loadingId === r.id}>Reject</button>
              <button className="btn" onClick={() => {
                const note = prompt('Return note (optional):')
                postAction('/api/qa/return', { reportId: r.id, note })
              }} disabled={loadingId === r.id}>Return To Analyst</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
