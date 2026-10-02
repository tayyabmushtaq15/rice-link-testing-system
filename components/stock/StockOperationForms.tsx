"use client"

import { createStockAdjustment, transferStock } from "@/actions/stock"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ServerActionForm } from "@/components/ui/ServerActionForm"

type Product = { id: string; name: string; unit: { symbol: string } }
type Godown = { id: string; name: string }

export function StockOperationForms({
  products,
  godowns,
}: {
  products: Product[]
  godowns: Godown[]
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Stock Adjustment</CardTitle>
        </CardHeader>
        <CardContent>
          <ServerActionForm action={createStockAdjustment} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Product</label>
              <select
                name="productId"
                required
                className="mt-1 h-9 w-full rounded-md border bg-transparent px-3 text-sm"
              >
                <option value="">Select product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.unit.symbol})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Godown</label>
              <select
                name="godownId"
                required
                className="mt-1 h-9 w-full rounded-md border bg-transparent px-3 text-sm"
              >
                <option value="">Select godown</option>
                {godowns.map((godown) => (
                  <option key={godown.id} value={godown.id}>
                    {godown.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Direction</label>
              <select
                name="direction"
                defaultValue="IN"
                className="mt-1 h-9 w-full rounded-md border bg-transparent px-3 text-sm"
              >
                <option value="IN">Stock in</option>
                <option value="OUT">Stock out</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Quantity</label>
              <input
                name="quantity"
                type="number"
                min="0.001"
                step="0.001"
                required
                className="mt-1 h-9 w-full rounded-md border bg-transparent px-3 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Unit cost</label>
              <input
                name="unitCost"
                type="number"
                min="0"
                step="0.01"
                defaultValue="0"
                className="mt-1 h-9 w-full rounded-md border bg-transparent px-3 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Reason</label>
              <input
                name="reason"
                required
                placeholder="e.g. Opening balance"
                className="mt-1 h-9 w-full rounded-md border bg-transparent px-3 text-sm"
              />
            </div>
            <button
              type="submit"
              className="h-9 rounded-md bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700 md:col-span-2"
            >
              Post Adjustment
            </button>
          </ServerActionForm>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Transfer Between Godowns</CardTitle>
        </CardHeader>
        <CardContent>
          <ServerActionForm action={transferStock} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Product</label>
              <select
                name="productId"
                required
                className="mt-1 h-9 w-full rounded-md border bg-transparent px-3 text-sm"
              >
                <option value="">Select product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.unit.symbol})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Quantity</label>
              <input
                name="quantity"
                type="number"
                min="0.001"
                step="0.001"
                required
                className="mt-1 h-9 w-full rounded-md border bg-transparent px-3 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">From godown</label>
              <select
                name="fromGodownId"
                required
                className="mt-1 h-9 w-full rounded-md border bg-transparent px-3 text-sm"
              >
                <option value="">Select source</option>
                {godowns.map((godown) => (
                  <option key={godown.id} value={godown.id}>
                    {godown.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">To godown</label>
              <select
                name="toGodownId"
                required
                className="mt-1 h-9 w-full rounded-md border bg-transparent px-3 text-sm"
              >
                <option value="">Select destination</option>
                {godowns.map((godown) => (
                  <option key={godown.id} value={godown.id}>
                    {godown.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Reason</label>
              <input
                name="reason"
                required
                placeholder="e.g. Move to finished goods"
                className="mt-1 h-9 w-full rounded-md border bg-transparent px-3 text-sm"
              />
            </div>
            <button
              type="submit"
              className="h-9 rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 md:col-span-2"
            >
              Transfer Stock
            </button>
          </ServerActionForm>
        </CardContent>
      </Card>
    </div>
  )
}
