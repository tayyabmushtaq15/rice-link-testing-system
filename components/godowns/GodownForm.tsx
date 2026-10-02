"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import * as z from "zod"
import { createGodown, updateGodown } from "@/actions/godowns"

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
  location: z.string().optional().or(z.literal("")),
  capacity: z.number().min(0, "Capacity must be a positive number"),
  unitId: z.string().min(1, "Unit is required"),
})

type GodownFormValues = z.infer<typeof formSchema>

type GodownFormInitialData = {
  id: string
  name: string
  location: string | null
  capacity: number | string
  unitId: string
}

type Unit = { id: string; name: string; symbol: string }

export function GodownForm({
  initialData,
  units,
}: {
  initialData?: GodownFormInitialData
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
  } = useForm<GodownFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      location: initialData?.location || "",
      capacity: initialData ? Number(initialData.capacity) : 0,
      unitId: initialData?.unitId || units[0]?.id || "",
    },
  })

  const unitId = watch("unitId")

  async function onSubmit(data: GodownFormValues) {
    setLoading(true)
    setError(null)
    try {
      if (initialData) {
        await updateGodown(initialData.id, data)
      } else {
        await createGodown(data)
      }
      router.push("/dashboard/godowns")
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
        <CardTitle>{initialData ? "Edit Godown" : "Add Godown"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div>
            <Label htmlFor="name">Godown name</Label>
            <Input
              id="name"
              placeholder="e.g. Finished Goods Warehouse"
              disabled={loading}
              {...register("name")}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g. Mill Site - Block B"
              disabled={loading}
              {...register("location")}
            />
          </div>
          <div>
            <Label htmlFor="capacity">Capacity</Label>
            <Input
              id="capacity"
              type="number"
              min="0"
              step="0.001"
              disabled={loading}
              {...register("capacity", { valueAsNumber: true })}
            />
            {errors.capacity && (
              <p className="mt-1 text-sm text-red-600">{errors.capacity.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="unitId">Capacity unit</Label>
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
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? "Saving..." : initialData ? "Save changes" : "Create Godown"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => router.push("/dashboard/godowns")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
