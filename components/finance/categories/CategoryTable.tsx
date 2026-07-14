"use client"

import { useState } from "react"
import Link from "next/link"
import { toggleCategoryStatus } from "@/actions/finance/categories"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Edit, CheckCircle, Circle } from "lucide-react"

interface Category {
  id: string
  name: string
  description: string | null
  isActive: boolean
  createdAt: Date
}

interface CategoryTableProps {
  categories: Category[]
  onStatusChange?: () => void
}

export function CategoryTable({ categories, onStatusChange }: CategoryTableProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")

  const handleToggleStatus = async (id: string) => {
    setIsLoading(true)
    setError("")
    try {
      await toggleCategoryStatus(id)
      onStatusChange?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update category status")
    } finally {
      setIsLoading(false)
    }
  }

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No categories found. Create one to get started.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categories</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {category.description || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={category.isActive ? "default" : "secondary"}>
                      {category.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Link href={`/dashboard/finance/categories/${category.id}/edit`}>
                        <Button variant="ghost" size="sm" disabled={isLoading}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(category.id)}
                        disabled={isLoading}
                        title={category.isActive ? "Deactivate" : "Activate"}
                      >
                        {category.isActive ? (
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Circle className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
