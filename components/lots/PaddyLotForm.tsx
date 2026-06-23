"use client"

import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { createPaddyLot, updatePaddyLot } from "@/actions/paddyLots"

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const formSchema = z.object({
  millId: z.string().min(1, "Mill is required"),
  supplierName: z.string().min(2, "Supplier name must be at least 2 characters"),
  variety: z.string().min(2, "Variety must be at least 2 characters"),
  cropYear: z.string().min(4, "Crop year is required"),
  purchaseDate: z.date(),
  weight: z.coerce.number().min(0.1, "Weight must be greater than 0"),
  moisture: z.coerce.number().min(0, "Moisture cannot be negative").max(100, "Moisture cannot exceed 100%"),
  purchaseRate: z.coerce.number().min(0, "Purchase rate cannot be negative"),
  status: z.enum(["OPEN", "PROCESSING", "COMPLETED"]).default("OPEN"),
})

type PaddyLotFormInput = Omit<z.input<typeof formSchema>, "weight" | "moisture" | "purchaseRate"> & {
  weight: number
  moisture: number
  purchaseRate: number
}
type PaddyLotFormValues = z.infer<typeof formSchema>

interface PaddyLotFormProps {
  initialData?: Partial<PaddyLotFormValues> & { purchaseDate?: string | Date }
  lotId?: string
  mills: { id: string; name: string }[]
}

export function PaddyLotForm({ initialData, lotId, mills }: PaddyLotFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<PaddyLotFormInput, unknown, PaddyLotFormValues>({
    resolver: zodResolver(formSchema) as Resolver<PaddyLotFormInput, unknown, PaddyLotFormValues>,
    defaultValues: {
      millId: initialData?.millId || "",
      supplierName: initialData?.supplierName || "",
      variety: initialData?.variety || "",
      cropYear: initialData?.cropYear || new Date().getFullYear().toString(),
      purchaseDate: initialData?.purchaseDate
        ? new Date(initialData.purchaseDate)
        : new Date(),
      weight: initialData?.weight || 0,
      moisture: initialData?.moisture || 0,
      purchaseRate: initialData?.purchaseRate || 0,
      status: initialData?.status || "OPEN",
    },
  })

  async function onSubmit(data: PaddyLotFormValues) {
    setIsSubmitting(true)
    try {
      if (initialData && lotId) {
        await updatePaddyLot(lotId, data)
      } else {
        await createPaddyLot(data)
      }
      router.push("/dashboard/lots")
    } catch (error) {
      console.error(error)
      alert("Something went wrong.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle>{initialData ? "Edit Paddy Lot" : "Register New Paddy Lot"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <FormField
                control={form.control}
                name="millId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Mill</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a mill">
                            {field.value ? mills.find((m) => m.id === field.value)?.name : "Select a mill"}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mills.map((mill) => (
                          <SelectItem key={mill.id} value={mill.id}>
                            {mill.name}
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
                name="supplierName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Acme Farms" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="variety"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rice Variety</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Basmati" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cropYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Crop Year</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 2024" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="purchaseDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col mt-2">
                    <FormLabel>Purchase Date</FormLabel>
                    <Popover>
                      <FormControl>
                        <PopoverTrigger 
                          className={cn(
                            "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            field.value.toLocaleDateString()
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="h-4 w-4 opacity-50" />
                        </PopoverTrigger>
                      </FormControl>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (KG)</FormLabel>
                    <FormControl>
                      <Input
                      type="number"
                      step="0.1"
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="moisture"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moisture (%)</FormLabel>
                    <FormControl>
                      <Input
                      type="number"
                      step="0.1"
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="purchaseRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Rate</FormLabel>
                    <FormControl>
                      <Input
                      type="number"
                      step="0.01"
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {initialData && (
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status">
                              {field.value === "OPEN" ? "Open" : field.value === "PROCESSING" ? "Processing" : field.value === "COMPLETED" ? "Completed" : "Select status"}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="OPEN">Open</SelectItem>
                          <SelectItem value="PROCESSING">Processing</SelectItem>
                          <SelectItem value="COMPLETED">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
                {isSubmitting ? "Saving..." : "Save Lot"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
