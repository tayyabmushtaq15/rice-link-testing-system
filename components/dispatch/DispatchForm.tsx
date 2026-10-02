"use client"

import { useMemo, useState } from "react"
import { createDispatch } from "@/actions/dispatch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ServerActionForm } from "@/components/ui/ServerActionForm"

type Sale = {
  id: string
  invoiceNo: string
  customer: { name: string }
  lines: {
    id: string
    productId: string
    quantity: unknown
    dispatchedQty: unknown
    product: { name: string; unit: { symbol: string } }
  }[]
}
type Godown = { id: string; name: string }
type Line = { saleLineId: string; quantity: string }

export function DispatchForm({ sales, godowns }: { sales: Sale[]; godowns: Godown[] }) {
  const [saleId, setSaleId] = useState("")
  const sale = sales.find((item) => item.id === saleId)
  const [lines, setLines] = useState<Line[]>([])
  const availableLines =
    sale?.lines.filter((line) => Number(line.quantity) > Number(line.dispatchedQty)) || []
  const totalQuantity = useMemo(
    () => lines.reduce((sum, line) => sum + (Number(line.quantity) || 0), 0),
    [lines],
  )
  function selectSale(value: string) {
    setSaleId(value)
    const selected = sales.find((item) => item.id === value)
    setLines(
      selected?.lines
        .filter((line) => Number(line.quantity) > Number(line.dispatchedQty))
        .map((line) => ({ saleLineId: line.id, quantity: "" })) || [],
    )
  }
  return (
    <ServerActionForm action={createDispatch} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="saleId">Sale invoice *</Label>
          <select
            id="saleId"
            name="saleId"
            required
            value={saleId}
            onChange={(event) => selectSale(event.target.value)}
            className="mt-1 h-9 w-full rounded-md border bg-transparent px-3 text-sm"
          >
            <option value="">Select sale invoice...</option>
            {sales.map((item) => (
              <option key={item.id} value={item.id}>
                {item.invoiceNo} · {item.customer.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="dispatchDate">Dispatch date *</Label>
          <Input
            id="dispatchDate"
            name="dispatchDate"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
        </div>
        <div>
          <Label htmlFor="godownId">Godown *</Label>
          <select
            id="godownId"
            name="godownId"
            required
            className="mt-1 h-9 w-full rounded-md border bg-transparent px-3 text-sm"
          >
            <option value="">Select godown...</option>
            {godowns.map((godown) => (
              <option key={godown.id} value={godown.id}>
                {godown.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue="PENDING"
            className="mt-1 h-9 w-full rounded-md border bg-transparent px-3 text-sm"
          >
            <option value="PENDING">Pending</option>
            <option value="LOADING">Loading</option>
            <option value="DISPATCHED">Dispatched (deduct stock)</option>
            <option value="DELIVERED">Delivered (deduct stock)</option>
          </select>
        </div>
        <div>
          <Label htmlFor="vehicleNo">Vehicle number</Label>
          <Input id="vehicleNo" name="vehicleNo" placeholder="e.g. LEX-1234" />
        </div>
        <div>
          <Label htmlFor="driverName">Driver name</Label>
          <Input id="driverName" name="driverName" />
        </div>
      </div>
      <div>
        <Label>Dispatch quantities</Label>
        {!sale ? (
          <p className="mt-2 rounded-lg border p-4 text-sm text-muted-foreground">
            Select a sale invoice to choose remaining quantities.
          </p>
        ) : availableLines.length === 0 ? (
          <p className="mt-2 rounded-lg border p-4 text-sm text-muted-foreground">
            This invoice has no remaining quantity to dispatch.
          </p>
        ) : (
          <div className="mt-2 overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[620px] text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 text-left">Product</th>
                  <th className="p-3 text-left">Remaining</th>
                  <th className="p-3 text-left">Dispatch quantity</th>
                  <th className="p-3 text-left">Unit</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) => {
                  const saleLine = sale.lines.find((item) => item.id === line.saleLineId)!
                  const remaining = Number(saleLine.quantity) - Number(saleLine.dispatchedQty)
                  return (
                    <tr key={line.saleLineId} className="border-t">
                      <td className="p-2">{saleLine.product.name}</td>
                      <td className="p-2">
                        {remaining} {saleLine.product.unit.symbol}
                      </td>
                      <td className="p-2">
                        <Input
                          name={`line-${index}`}
                          type="number"
                          min="0.001"
                          max={remaining}
                          step="0.001"
                          value={line.quantity}
                          onChange={(event) =>
                            setLines((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, quantity: event.target.value }
                                  : item,
                              ),
                            )
                          }
                          required
                        />
                      </td>
                      <td className="p-2">{saleLine.product.unit.symbol}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <input
          type="hidden"
          name="lines"
          value={JSON.stringify(
            lines
              .filter((line) => Number(line.quantity) > 0)
              .map((line) => ({ saleLineId: line.saleLineId, quantity: Number(line.quantity) })),
          )}
        />
      </div>
      <div>
        <Label htmlFor="deliveryNotes">Delivery notes</Label>
        <Input
          id="deliveryNotes"
          name="deliveryNotes"
          placeholder="Optional delivery information"
        />
      </div>
      <div className="rounded-lg bg-slate-50 p-4 text-sm">
        Total dispatch quantity:{" "}
        <span className="font-semibold">{totalQuantity.toLocaleString()}</span>
      </div>
      <div className="flex gap-3">
        <Button type="submit" className="bg-violet-600 hover:bg-violet-700">
          Save Dispatch
        </Button>
        <Button type="button" variant="outline" onClick={() => history.back()}>
          Cancel
        </Button>
      </div>
    </ServerActionForm>
  )
}
