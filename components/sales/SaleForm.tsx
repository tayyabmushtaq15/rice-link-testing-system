"use client"

import { useMemo, useState } from "react"
import { createSale } from "@/actions/sales"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ServerActionForm } from "@/components/ui/ServerActionForm"

type Product = { id: string; name: string; unit: { symbol: string } }
type Line = { productId: string; quantity: string; unitRate: string }

export function SaleForm({
  customers,
  products,
  godowns,
}: {
  customers: { id: string; name: string }[]
  products: Product[]
  godowns: { id: string; name: string }[]
}) {
  const [lines, setLines] = useState<Line[]>([{ productId: "", quantity: "", unitRate: "" }])
  const itemsTotal = useMemo(
    () =>
      lines.reduce(
        (sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.unitRate) || 0),
        0,
      ),
    [lines],
  )
  const [discount, setDiscount] = useState("0")
  const [transport, setTransport] = useState("0")
  const [taxRate, setTaxRate] = useState("0")
  const preTaxTotal = Math.max(itemsTotal - (Number(discount) || 0) + (Number(transport) || 0), 0)
  const taxAmount = Math.round(preTaxTotal * (Number(taxRate) / 100) * 100) / 100
  const grandTotal = preTaxTotal + taxAmount
  function updateLine(index: number, key: keyof Line, value: string) {
    setLines((current) =>
      current.map((line, lineIndex) => (lineIndex === index ? { ...line, [key]: value } : line)),
    )
  }
  return (
    <ServerActionForm action={createSale} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="customerId">Customer *</Label>
          <select
            id="customerId"
            name="customerId"
            required
            className="mt-1 h-9 w-full rounded-md border bg-transparent px-3 text-sm"
          >
            <option value="">Select customer...</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="invoiceDate">Sale date *</Label>
          <Input
            id="invoiceDate"
            name="invoiceDate"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
        </div>
        <div>
          <Label htmlFor="godownId">Godown (dispatch from) *</Label>
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
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label>Products *</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              setLines((current) => [...current, { productId: "", quantity: "", unitRate: "" }])
            }
          >
            + Add another product
          </Button>
        </div>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left">Product</th>
                <th className="p-3 text-left">Qty</th>
                <th className="p-3 text-left">Unit</th>
                <th className="p-3 text-left">Rate</th>
                <th className="p-3 text-right">Total</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => {
                const product = products.find((item) => item.id === line.productId)
                const total = (Number(line.quantity) || 0) * (Number(line.unitRate) || 0)
                return (
                  <tr key={index} className="border-t">
                    <td className="p-2">
                      <select
                        value={line.productId}
                        onChange={(event) => updateLine(index, "productId", event.target.value)}
                        required
                        className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                      >
                        <option value="">Select product...</option>
                        {products.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        min="0.001"
                        step="0.001"
                        value={line.quantity}
                        onChange={(event) => updateLine(index, "quantity", event.target.value)}
                        required
                      />
                    </td>
                    <td className="p-2 text-muted-foreground">{product?.unit.symbol || "-"}</td>
                    <td className="p-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.unitRate}
                        onChange={(event) => updateLine(index, "unitRate", event.target.value)}
                        required
                      />
                    </td>
                    <td className="p-2 text-right">PKR {total.toLocaleString()}</td>
                    <td className="p-2 text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={lines.length === 1}
                        onClick={() =>
                          setLines((current) =>
                            current.filter((_, lineIndex) => lineIndex !== index),
                          )
                        }
                      >
                        ×
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <input
          type="hidden"
          name="lines"
          value={JSON.stringify(
            lines.map((line) => ({
              productId: line.productId,
              quantity: Number(line.quantity),
              unitRate: Number(line.unitRate),
            })),
          )}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <Label htmlFor="discount">Discount</Label>
          <Input
            id="discount"
            name="discount"
            type="number"
            min="0"
            step="0.01"
            value={discount}
            onChange={(event) => setDiscount(event.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="transportCost">Transport</Label>
          <Input
            id="transportCost"
            name="transportCost"
            type="number"
            min="0"
            step="0.01"
            value={transport}
            onChange={(event) => setTransport(event.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="taxRate">Tax</Label>
          <select
            id="taxRate"
            name="taxRate"
            value={taxRate}
            onChange={(event) => setTaxRate(event.target.value)}
            className="mt-1 h-9 w-full rounded-md border bg-transparent px-3 text-sm"
          >
            <option value="0">Nil</option>
            <option value="0.25">0.25%</option>
            <option value="1.25">1.25%</option>
          </select>
        </div>
      </div>
      <div className="grid gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-4">
        <div>
          <p className="text-sm text-muted-foreground">Items total</p>
          <p className="text-xl font-semibold">PKR {itemsTotal.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Tax ({taxRate}%)</p>
          <p className="text-xl font-semibold">PKR {taxAmount.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Grand total</p>
          <p className="text-xl font-semibold">PKR {grandTotal.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Remaining</p>
          <p className="text-xl font-semibold">PKR {grandTotal.toLocaleString()}</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <Label htmlFor="paymentType">Payment type</Label>
          <select
            id="paymentType"
            name="paymentType"
            defaultValue="CREDIT"
            className="mt-1 h-9 w-full rounded-md border bg-transparent px-3 text-sm"
          >
            <option value="CREDIT">Credit (pay later)</option>
            <option value="CASH">Cash (pay in full now)</option>
          </select>
        </div>
        <div>
          <Label htmlFor="paymentMethod">Payment method</Label>
          <select
            id="paymentMethod"
            name="paymentMethod"
            defaultValue="CASH"
            className="mt-1 h-9 w-full rounded-md border bg-transparent px-3 text-sm"
          >
            <option value="CASH">Cash</option>
            <option value="BANK">Bank</option>
            <option value="CHEQUE">Cheque</option>
          </select>
        </div>
        <div>
          <Label htmlFor="receivedAmount">Amount received now</Label>
          <Input
            id="receivedAmount"
            name="receivedAmount"
            type="number"
            min="0"
            step="0.01"
            defaultValue="0"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Input id="notes" name="notes" />
      </div>
      <div className="flex gap-3">
        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
          Save Sale
        </Button>
        <Button type="button" variant="outline" onClick={() => history.back()}>
          Cancel
        </Button>
      </div>
    </ServerActionForm>
  )
}
