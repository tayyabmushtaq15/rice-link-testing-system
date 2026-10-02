"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import * as z from "zod"
import { createProduct, updateProduct, type ProductFormValues } from "@/actions/products"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  sku: z.string().optional().or(z.literal("")),
  type: z.enum(["RAW_MATERIAL", "FINISHED_GOOD", "BY_PRODUCT", "PACKAGING"]),
  categoryId: z.string().optional().or(z.literal("")),
  unitId: z.string().min(1, "Unit is required"),
  requiresQa: z.boolean(),
})

const productTypes = [
  { value: "RAW_MATERIAL", label: "Raw material" },
  { value: "FINISHED_GOOD", label: "Finished good" },
  { value: "BY_PRODUCT", label: "By-product" },
  { value: "PACKAGING", label: "Packaging" },
] as const

type ProductFormInitialData = {
  id: string
  name: string
  sku: string | null
  type: string
  categoryId: string | null
  unitId: string
  requiresQa: boolean
}

type Category = { id: string; name: string }
type Unit = { id: string; name: string; symbol: string }

export function ProductForm({
  initialData,
  categories,
  units,
}: {
  initialData?: ProductFormInitialData
  categories: Category[]
  units: Unit[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      sku: initialData?.sku || "",
      type: (initialData?.type as ProductFormValues["type"]) || "FINISHED_GOOD",
      categoryId: initialData?.categoryId || "",
      unitId: initialData?.unitId || units[0]?.id || "",
      requiresQa: initialData?.requiresQa || false,
    },
  })

  const type = watch("type")
  const categoryId = watch("categoryId")
  const unitId = watch("unitId")

  async function onSubmit(data: ProductFormValues) {
    setLoading(true)
    setError(null)
    try {
      if (initialData) {
        await updateProduct(initialData.id, data)
      } else {
        await createProduct(data)
      }
      router.push("/dashboard/products")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{initialData ? "Edit Product" : "Add Product"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div>
            <Label htmlFor="name">Product name</Label>
            <Input
              id="name"
              placeholder="e.g. Super Basmati Rice"
              disabled={loading}
              {...register("name")}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              placeholder="e.g. RICE-BASMATI"
              disabled={loading}
              {...register("sku")}
            />
          </div>
          <div>
            <Label htmlFor="type">Type</Label>
            <Select
              value={type}
              onValueChange={(value) => setValue("type", value as ProductFormValues["type"])}
            >
              <SelectTrigger id="type">
                <SelectValue>
                  {(value: string) => productTypes.find((t) => t.value === value)?.label ?? value}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {productTypes.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="categoryId">Category</Label>
            <Select
              value={categoryId || "none"}
              onValueChange={(value) =>
                setValue("categoryId", !value || value === "none" ? "" : value)
              }
            >
              <SelectTrigger id="categoryId">
                <SelectValue>
                  {(value: string) =>
                    value === "none"
                      ? "No category"
                      : (categories.find((c) => c.id === value)?.name ?? "No category")
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No category</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="unitId">Unit</Label>
            <Select value={unitId} onValueChange={(value) => value && setValue("unitId", value)}>
              <SelectTrigger id="unitId">
                <SelectValue placeholder="Select unit...">
                  {(value: string) => {
                    const unit = units.find((u) => u.id === value)
                    return unit ? `${unit.name} (${unit.symbol})` : "Select unit..."
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name} ({unit.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.unitId && <p className="mt-1 text-sm text-red-600">{errors.unitId.message}</p>}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" disabled={loading} {...register("requiresQa")} />
            Requires QA approval
          </label>
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? "Saving..." : initialData ? "Save changes" : "Create Product"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => router.push("/dashboard/products")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
