"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import * as z from "zod"
import { createSupplier, updateSupplier, type SupplierFormValues } from "@/actions/suppliers"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  contactName: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
})

type SupplierFormInitialData = {
  id: string
  name: string
  contactName: string | null
  phone: string | null
  email: string | null
  address: string | null
}

export function SupplierForm({ initialData }: { initialData?: SupplierFormInitialData }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      contactName: initialData?.contactName || "",
      phone: initialData?.phone || "",
      email: initialData?.email || "",
      address: initialData?.address || "",
    },
  })

  async function onSubmit(data: SupplierFormValues) {
    setLoading(true)
    setError(null)
    try {
      if (initialData) {
        await updateSupplier(initialData.id, data)
      } else {
        await createSupplier(data)
      }
      router.push("/dashboard/suppliers")
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
        <CardTitle>{initialData ? "Edit Supplier" : "Add Supplier"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div>
            <Label htmlFor="name">Supplier name</Label>
            <Input
              id="name"
              placeholder="e.g. Chaudhry Paddy Suppliers"
              disabled={loading}
              {...register("name")}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="contactName">Contact person</Label>
            <Input id="contactName" disabled={loading} {...register("contactName")} />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" disabled={loading} {...register("phone")} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" disabled={loading} {...register("email")} />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Input id="address" disabled={loading} {...register("address")} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? "Saving..." : initialData ? "Save changes" : "Create Supplier"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => router.push("/dashboard/suppliers")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
