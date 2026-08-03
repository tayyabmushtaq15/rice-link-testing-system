"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { createExpense, updateExpense } from "@/actions/finance/expenses"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const formSchema = z.object({
  date: z.coerce.date(),
  categoryId: z.string().min(1, "Category is required"),
  vendorName: z.string().max(100, "Vendor name must be less than 100 characters").optional().or(z.literal("")),
  description: z.string().max(500, "Description must be less than 500 characters").optional().or(z.literal("")),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  invoiceNumber: z.string().max(100, "Invoice number must be less than 100 characters").optional().or(z.literal("")),
  attachment: z.string().max(500, "Attachment URL must be less than 500 characters").optional().or(z.literal("")),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional().or(z.literal("")),
  paddyLotId: z.string().optional().or(z.literal("")),
  employeeId: z.string().optional().or(z.literal("")),
})

type ExpenseFormValues = z.infer<typeof formSchema>

type ExpenseFormInitialData = Partial<ExpenseFormValues> & {
  id?: string
  transactionNo?: string
  category?: { id: string; name: string }
  paddyLotId?: string | null
  employeeId?: string | null
}

interface ExpenseFormProps {
  initialData?: ExpenseFormInitialData
  expenseId?: string
  categories: Array<{ id: string; name: string }>
  lots?: Array<{ id: string; lotNumber: string; supplierName: string }>
  employees?: Array<{ id: string; name: string; basicSalary: number }>
}

const paymentMethods = [
  "Bank Transfer",
  "Cash",
  "Check",
  "Credit Card",
  "Debit Card",
  "Online Payment",
  "Other",
]

export function ExpenseForm({
  initialData,
  expenseId,
  categories,
  lots = [],
  employees = [],
}: ExpenseFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>("")

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(formSchema) as never,
    defaultValues: {
      date: initialData?.date || new Date(),
      categoryId: initialData?.category?.id || initialData?.categoryId || "",
      vendorName: initialData?.vendorName || "",
      description: initialData?.description || "",
      amount: initialData?.amount ?? 0,
      paymentMethod: initialData?.paymentMethod || "",
      invoiceNumber: initialData?.invoiceNumber || "",
      attachment: initialData?.attachment || "",
      notes: initialData?.notes || "",
      paddyLotId: initialData?.paddyLotId || "",
      employeeId: initialData?.employeeId || "",
    },
  })

  async function onSubmit(data: ExpenseFormValues) {
    setIsSubmitting(true)
    setError("")
    try {
      if (initialData && expenseId) {
        await updateExpense(expenseId, data)
      } else {
        await createExpense(data)
      }
      router.push("/dashboard/finance/expenses")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{initialData ? "Edit Expense" : "Record New Expense"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
                {error}
              </div>
            )}

            {initialData?.transactionNo && (
              <div className="rounded-md bg-slate-50 p-4 text-sm">
                <span className="font-medium text-slate-700">Transaction No: </span>
                <span className="text-slate-600">{initialData.transactionNo}</span>
              </div>
            )}

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date *</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      {...field}
                      value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value ?? "")}
                    value={field.value || null}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select expense category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vendorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., ABC Supplies Ltd" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Linked Employee (optional)</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      const next = value === "none" ? "" : value
                      field.onChange(next)
                      if (next) {
                        const emp = employees.find((e) => e.id === next)
                        if (emp) {
                          form.setValue("vendorName", emp.name)
                          if (!form.getValues("amount")) {
                            form.setValue("amount", emp.basicSalary)
                          }
                        }
                      }
                    }}
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No employee link</SelectItem>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.name} — {emp.basicSalary.toLocaleString()} PKR
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (PKR) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      value={field.value === 0 ? "" : field.value}
                      onChange={(e) =>
                        field.onChange(e.target.value === "" ? 0 : Number(e.target.value))
                      }
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method *</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value ?? "")}
                    value={field.value || null}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="invoiceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., INV-2026-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <textarea 
                      placeholder="Optional description for this expense" 
                      className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus:border-slate-300 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="attachment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Attachment URL</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paddyLotId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Linked Paddy Lot (optional)</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select lot" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No lot link</SelectItem>
                      {lots.map((lot) => (
                        <SelectItem key={lot.id} value={lot.id}>
                          {lot.lotNumber} — {lot.supplierName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <textarea 
                      placeholder="Any additional notes" 
                      className="flex min-h-[60px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus:border-slate-300 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : initialData ? "Update Expense" : "Record Expense"}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
