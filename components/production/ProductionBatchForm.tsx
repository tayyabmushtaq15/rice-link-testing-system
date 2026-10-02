"use client"

import { useMemo, useState } from "react"
import { createProductionBatch } from "@/actions/productionBatches"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ServerActionForm } from "@/components/ui/ServerActionForm"
import {
  ReportTemplateSection,
  type ReportTemplateOption,
} from "@/components/reports/ReportTemplateSection"

type Product = { id: string; name: string; type: string; unit: { symbol: string } }
type Godown = { id: string; name: string }
type Line = { productId: string; quantity: string; rate: string }

export function ProductionBatchForm({
  godowns,
  products,
  reportTemplates = [],
}: {
  godowns: Godown[]
  products: Product[]
  reportTemplates?: ReportTemplateOption[]
}) {
  const [inputs, setInputs] = useState<Line[]>([{ productId: "", quantity: "", rate: "" }])
  const [outputs, setOutputs] = useState<Line[]>([{ productId: "", quantity: "", rate: "" }])
  const [totalCost, setTotalCost] = useState("0")
  const [openTemplates, setOpenTemplates] = useState<Record<string, boolean>>({})
  const [reportValues, setReportValues] = useState<Record<string, Record<string, string>>>({})
  const inputProducts = products.filter((product) => product.type === "RAW_MATERIAL")
  const outputProducts = products.filter((product) => product.type !== "RAW_MATERIAL")
  const totalInput = useMemo(
    () => inputs.reduce((sum, line) => sum + (Number(line.quantity) || 0), 0),
    [inputs],
  )
  const totalOutput = useMemo(
    () => outputs.reduce((sum, line) => sum + (Number(line.quantity) || 0), 0),
    [outputs],
  )
  const yieldPercent = totalInput > 0 ? (totalOutput / totalInput) * 100 : 0

  const costSplit = useMemo(() => {
    const weights = outputs.map((line) => (Number(line.quantity) || 0) * (Number(line.rate) || 0))
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
    const cost = Number(totalCost) || 0
    return outputs.map((line, index) => ({
      product: outputProducts.find((item) => item.id === line.productId),
      weight: weights[index],
      share: totalWeight > 0 ? (cost * weights[index]) / totalWeight : 0,
    }))
  }, [outputs, outputProducts, totalCost])
  const totalWeight = costSplit.reduce((sum, item) => sum + item.weight, 0)

  function change(
    setter: React.Dispatch<React.SetStateAction<Line[]>>,
    index: number,
    key: keyof Line,
    value: string,
  ) {
    setter((lines) =>
      lines.map((line, lineIndex) => (lineIndex === index ? { ...line, [key]: value } : line)),
    )
  }

  function lineEditor(
    lines: Line[],
    setter: React.Dispatch<React.SetStateAction<Line[]>>,
    options: Product[],
    label: string,
    showRate: boolean,
  ) {
    return (
      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label>{label} *</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              setter((current) => [...current, { productId: "", quantity: "", rate: "" }])
            }
          >
            + Add another
          </Button>
        </div>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left">Product</th>
                <th className="p-3 text-left">Quantity</th>
                <th className="p-3 text-left">Unit</th>
                {showRate && <th className="p-3 text-left">Rate (per unit)</th>}
                <th />
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => {
                const product = options.find((item) => item.id === line.productId)
                return (
                  <tr key={index} className="border-t">
                    <td className="p-2">
                      <select
                        value={line.productId}
                        onChange={(event) => change(setter, index, "productId", event.target.value)}
                        required
                        className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                      >
                        <option value="">Select product...</option>
                        {options.map((item) => (
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
                        onChange={(event) => change(setter, index, "quantity", event.target.value)}
                        required
                      />
                    </td>
                    <td className="p-2 text-muted-foreground">{product?.unit.symbol || "-"}</td>
                    {showRate && (
                      <td className="p-2">
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          placeholder="Relative value"
                          value={line.rate}
                          onChange={(event) => change(setter, index, "rate", event.target.value)}
                          required
                        />
                      </td>
                    )}
                    <td className="p-2 text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={lines.length === 1}
                        onClick={() =>
                          setter((current) => current.filter((_, lineIndex) => lineIndex !== index))
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
      </div>
    )
  }

  return (
    <ServerActionForm action={createProductionBatch} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="productionDate">Production date *</Label>
          <Input
            id="productionDate"
            name="productionDate"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
        </div>
        <div>
          <Label htmlFor="inputGodownId">Source godown (raw material) *</Label>
          <select
            id="inputGodownId"
            name="inputGodownId"
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
          <Label htmlFor="outputGodownId">Output godown (finished goods) *</Label>
          <select
            id="outputGodownId"
            name="outputGodownId"
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
      {lineEditor(inputs, setInputs, inputProducts, "Raw material inputs", false)}
      {lineEditor(outputs, setOutputs, outputProducts, "Output products", true)}
      <div className="grid gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-3">
        <div>
          <p className="text-sm text-muted-foreground">Total input</p>
          <p className="text-xl font-semibold">{totalInput.toLocaleString()} units</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total output</p>
          <p className="text-xl font-semibold">{totalOutput.toLocaleString()} units</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Yield</p>
          <p className="text-xl font-semibold">{yieldPercent.toFixed(1)}%</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="totalCost">Production cost</Label>
          <Input
            id="totalCost"
            name="totalCost"
            type="number"
            min="0"
            step="0.01"
            value={totalCost}
            onChange={(event) => setTotalCost(event.target.value)}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Labor, electricity, drying — whatever it cost to run this batch. Posted as a
            &quot;Processing&quot; expense once the batch completes.
          </p>
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue="DRAFT"
            className="mt-1 h-9 w-full rounded-md border bg-transparent px-3 text-sm"
          >
            <option value="DRAFT">Draft (no stock change)</option>
            <option value="IN_PROGRESS">In Progress (no stock change)</option>
            <option value="COMPLETED">Completed (updates stock immediately)</option>
          </select>
        </div>
      </div>
      {totalWeight > 0 && (
        <div className="rounded-lg border p-4">
          <p className="mb-2 text-sm font-medium">Estimated processing cost split</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="pb-2 font-normal">Output</th>
                <th className="pb-2 text-right font-normal">Relative weight</th>
                <th className="pb-2 text-right font-normal">Share of processing cost</th>
              </tr>
            </thead>
            <tbody>
              {costSplit.map((item, index) => (
                <tr key={index} className="border-t">
                  <td className="py-1.5">{item.product?.name || "-"}</td>
                  <td className="py-1.5 text-right">{item.weight.toLocaleString()}</td>
                  <td className="py-1.5 text-right">
                    PKR {item.share.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-muted-foreground">
            The final cost of each output also includes its share of the raw material consumed,
            calculated automatically from current stock value at save time.
          </p>
        </div>
      )}
      {reportTemplates.length > 0 && (
        <div>
          <Label>Quality Reports</Label>
          <p className="mb-2 text-xs text-muted-foreground">
            Optional — fill in a report now if the values are available, or skip and add it later.
          </p>
          <div className="space-y-3">
            {reportTemplates.map((template) => (
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
              reportTemplates
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
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Input id="notes" name="notes" />
      </div>
      <input
        type="hidden"
        name="inputs"
        value={JSON.stringify(
          inputs.map((line) => ({ productId: line.productId, quantity: Number(line.quantity) })),
        )}
      />
      <input
        type="hidden"
        name="outputs"
        value={JSON.stringify(
          outputs.map((line) => ({
            productId: line.productId,
            quantity: Number(line.quantity),
            rate: Number(line.rate) || 0,
          })),
        )}
      />
      <div className="flex gap-3">
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          Save Batch
        </Button>
        <Button type="button" variant="outline" onClick={() => history.back()}>
          Cancel
        </Button>
      </div>
    </ServerActionForm>
  )
}
