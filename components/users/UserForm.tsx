"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createUser, updateUser, UserFormValues, UpdateUserFormValues } from "@/actions/users"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

const userFormSchema = z.object({
  email: z.string().email("Invalid email"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["ADMIN", "ANALYST", "QA", "MILL_OWNER"]),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
})

type UserFormSchemaType = z.infer<typeof userFormSchema>

interface UserFormProps {
  initialData?: {
    id: string
    email: string
    name: string | null
    role: string
  }
}

export function UserForm({ initialData }: UserFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<UserFormSchemaType>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: initialData?.email || "",
      name: initialData?.name || "",
      role: (initialData?.role as any) || "ANALYST",
      password: "",
    },
  })

  const role = watch("role")

  const onSubmit = async (data: UserFormSchemaType) => {
    setLoading(true)
    setError(null)

    try {
      if (initialData) {
        // Update user
        const updateData: UpdateUserFormValues = {
          email: data.email,
          name: data.name,
          role: data.role as any,
          ...(data.password && { password: data.password }),
        }
        await updateUser(initialData.id, updateData)
      } else {
        // Create user
        if (!data.password) {
          setError("Password is required for new users")
          setLoading(false)
          return
        }
        const createData: UserFormValues = {
          email: data.email,
          name: data.name,
          role: data.role as any,
          password: data.password,
        }
        await createUser(createData)
      }

      router.push("/dashboard/users")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{initialData ? "Edit User" : "Create New User"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              {...register("email")}
              disabled={loading || !!initialData}
            />
            {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              {...register("name")}
              disabled={loading}
            />
            {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(val) => setValue("role", val as any)}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="ANALYST">Analyst</SelectItem>
                <SelectItem value="QA">QA</SelectItem>
                <SelectItem value="MILL_OWNER">Mill Owner</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && <p className="text-sm text-red-600">{errors.role.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              {initialData ? "New Password (leave blank to keep current)" : "Password"}
            </Label>
            <Input
              id="password"
              type="password"
              placeholder={initialData ? "Leave blank to keep current password" : "At least 6 characters"}
              {...register("password")}
              disabled={loading}
            />
            {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? "Saving..." : initialData ? "Update User" : "Create User"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/users")}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
