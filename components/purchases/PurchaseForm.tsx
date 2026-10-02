"use client"

import { useMemo, useState } from "react"
import { createPurchase, updatePurchase } from "@/actions/purchases"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ServerActionForm } from "@/components/ui/ServerActionForm"
import { AlertCircle } from "lucide-react"
import {
  ReportTemplateSection,
  type ReportTemplateOption,
} from "@/components/reports/ReportTemplateSection"

type Product = { id: string; name: string; type: string; unit: { symbol: string } }
type PurchaseReportTemplate = ReportTemplateOption & { appliesToProductType: string | null }
type Setup = {
  suppliers: { id: string; name: string }[]
  products: Product[]
  godowns: { id: string; name: string }[]
  mills: { id: string; name: string }[]
  reportTemplates?: PurchaseReportTemplate[]
}
type Line = { id?: string; productId: string; quantity: string; unitRate: string }
type LockedLine = {
  productId: string
  productName: string
  purchasedQty: number
  currentBalance: number
}
type InitialData = {
  id: string
  supplierId: string
  godownId: string
  millId: string | null
  purchaseDate: string
  invoiceNumber: string | null
  transportCost: string
  otherCost: string
  paidAmount: string
  paymentMethod: string
  notes: string | null
  lines: Line[]
}

export function PurchaseForm({
  suppliers,
  products,
  godowns,
  mills,
  reportTemplates = [],
  initialData,
  locked = false,
  lockedLines = [],
}: Setup & { initialData?: InitialData; locked?: boolean; lockedLines?: LockedLine[] }) {
  const [lines, setLines] = useState<Line[]>(
    initialData?.lines.length ? initialData.lines : [{ productId: "", quantity: "", unitRate: "" }],
  )
  const itemsTotal = useMemo(
    () =>
      lines.reduce(
        (sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.unitRate) || 0),
        0,
      ),
    [lines],
  )

  const [openTemplates, setOpenTemplates] = useState<Record<string, boolean>>({})
  const [reportValues, setReportValues] = useState<Record<string, Record<string, string>>>({})

  const matchedTemplates = useMemo(() => {
    if (initialData) return []
    const types = new Set(
      lines
        .map((line) => products.find((product) => product.id === line.productId)?.type)
        .filter(Boolean),
    )
    return reportTemplates.filter(
      (template) => !template.appliesToProductType || types.has(template.appliesToProductType),
    )
  }, [lines, products, reportTemplates, initialData])

  function updateLine(index: number, key: keyof Line, value: string) {
    setLines((current) =>
      current.map((line, lineIndex) => (lineIndex === index ? { ...line, [key]: value } : line)),
    )
  }

  return (
    <ServerActionForm
      action={initialData ? updatePurchase : createPurchase}
      className="space-y-6"
    >
      {initialData && <input type="hidden" name="id" value={initialData.id} />}
      {locked && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Godown, date, and line items are locked</p>
            <p className="mt-1">
              Stock from this purchase has already been used elsewhere, so changing quantities or
              moving it to another godown could make historical records inconsistent. Only
              supplier, invoice number, notes, costs, and payment can still be edited.
            </p>
            {lockedLines.length > 0 && (
              <ul className="mt-2 list-disc space-y-0.5 pl-5">
                {lockedLines.map((line) => (
                  <li key={line.productId}>
                    {line.productName}: purchased {line.purchasedQty.toLocaleString()}, only{" "}
                    {line.currentBalance.toLocaleString()} remains in stock
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="supplierId">Supplier *</Label>
          <select
            id="supplierId"
            name="supplierId"
            required
            defaultValue={initialData?.supplierId}
            className="mt-1 h-9 w-full rounded-md border bg-transparent px-3 text-sm"
          >
            <option value="">Select supplier...</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="purchaseDate">Purchase date *</Label>
          <Input
            id="purchaseDate"
            name="purchaseDate"
            type="date"
            required
            disabled={locked}
            defaultValue={initialData?.purchaseDate || new Date().toISOString().slice(0, 10)}
          />
        </div>
        <div>
          <Label htmlFor="invoiceNumber">Invoice number *</Label>
          <Input
            id="invoiceNumber"
            name="invoiceNumber"
            required
            placeholder="e.g. INV-1001"
            defaultValue={initialData?.invoiceNumber || ""}
          />
        </div>
        <div>
          <Label htmlFor="godownId">Godown *</Label>
          <select
            id="godownId"
            name="godownId"
            required
            disabled={locked}
            defaultValue={initialData?.godownId}
            className="mt-1 h-9 w-full rounded-md border bg-transparent px-3 text-sm disabled:opacity-60"
          >
            <option value="">Select godown...</option>
            {godowns.map((godown) => (
              <option key={godown.id} value={godown.id}>
                {godown.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-muted-foreground">
            All products in this purchase go into this godown.
          </p>
        </div>
        <div>
          <Label htmlFor="millId">Mill for paddy lot</Label>
          <select
            id="millId"
            name="millId"
            disabled={locked}
            defaultValue={initialData?.millId || ""}
            className="mt-1 h-9 w-full rounded-md border bg-transparent px-3 text-sm disabled:opacity-60"
          >
            <option value="">Do not create paddy lot</option>
            {mills.map((mill) => (
              <option key={mill.id} value={mill.id}>
                {mill.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label>Products *</Label>
          {!locked && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setLines((current) => [...current, { productId: "", quantity: "", unitRate: "" }])
              }
            >
              + Add another product
            </Button>
          )}
        </div>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left font-medium">Product</th>
                <th className="p-3 text-left font-medium">Qty</th>
                <th className="p-3 text-left font-medium">Unit</th>
                <th className="p-3 text-left font-medium">Rate</th>
                <th className="p-3 text-right font-medium">Total</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => {
                const product = products.find((item) => item.id === line.productId)
                const total = (Number(line.quantity) || 0) * (Number(line.unitRate) || 0)
                return (
                  <tr key={line.id || index} className="border-t">
                    <td className="p-2">
                      <select
                        value={line.productId}
                        onChange={(event) => updateLine(index, "productId", event.target.value)}
                        required
                        disabled={locked}
                        className="h-9 w-full rounded-md border bg-transparent px-3 text-sm disabled:opacity-60"
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
                        disabled={locked}
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
                        disabled={locked}
                      />
                    </td>
                    <td className="p-2 text-right">PKR {total.toLocaleString()}</td>
                    <td className="p-2 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={locked || lines.length === 1}
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
              id: line.id,
              productId: line.productId,
              quantity: Number(line.quantity),
              unitRate: Number(line.unitRate),
            })),
          )}
        />
      </div>

      {matchedTemplates.length > 0 && (
        <div>
          <Label>Quality Reports</Label>
          <p className="mb-2 text-xs text-muted-foreground">
            Optional — fill in a report now if the values are available, or skip and add it later.
          </p>
          <div className="space-y-3">
            {matchedTemplates.map((template) => (
              <ReportTemplateSection
                key={template.id}
                template={template}
                open={!!openTemplates[template.id]}
                onToggle={() =>
                  setOpenTemplates((current) => ({ ...current, [template.id]: !current[template.id] }))
                }
                values={reportValues[template.id] || {}}
                onChange={(fieldId, fieldValue) =>
                  setReportValues((current) => ({
                    ...current,
                    [template.id]: { ...current[template.id], [fieldId]: fieldValue },
                  }))
                }
              />
            ))}
          </div>
          <input
            type="hidden"
            name="reports"
            value={JSON.stringify(
              matchedTemplates
                .filter((template) => openTemplates[template.id])
                .map((template) => ({
                  templateId: template.id,
                  values: template.fields.map((field) => ({
                    templateFieldId: field.id,
                    value: reportValues[template.id]?.[field.id] || "",
                  })),
                })),
            )}
          />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="transportCost">Transport cost</Label>
          <Input
            id="transportCost"
            name="transportCost"
            type="number"
            min="0"
            step="0.01"
            defaultValue={initialData?.transportCost ?? "0"}
          />
        </div>
        <div>
          <Label htmlFor="otherCost">Other cost</Label>
          <Input
            id="otherCost"
            name="otherCost"
            type="number"
            min="0"
            step="0.01"
            defaultValue={initialData?.otherCost ?? "0"}
          />
        </div>
      </div>
      <div className="grid gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-2">
        <div>
          <p className="text-sm text-muted-foreground">Items total</p>
          <p className="text-xl font-semibold">PKR {itemsTotal.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Grand total before payment</p>
          <p className="text-xl font-semibold">PKR {itemsTotal.toLocaleString()} + costs</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="paidAmount">Amount paid now</Label>
          <Input
            id="paidAmount"
            name="paidAmount"
            type="number"
            min="0"
            step="0.01"
            defaultValue={initialData?.paidAmount ?? "0"}
          />
        </div>
        <div>
          <Label htmlFor="paymentMethod">Payment method</Label>
          <select
            id="paymentMethod"
            name="paymentMethod"
            defaultValue={initialData?.paymentMethod || "CASH"}
            className="mt-1 h-9 w-full rounded-md border bg-transparent px-3 text-sm"
          >
            <option value="CASH">Cash</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CHEQUE">Cheque</option>
          </select>
        </div>
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Input id="notes" name="notes" defaultValue={initialData?.notes || ""} />
      </div>
      <div className="flex gap-3">
        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
          {initialData ? "Save changes" : "Save Purchase"}
        </Button>
        <Button type="button" variant="outline" onClick={() => history.back()}>
          Cancel
        </Button>
      </div>
    </ServerActionForm>
  )
}
