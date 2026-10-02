import { createCategory, createUnit, getProductSetup } from "@/actions/products"
import { Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ServerActionForm } from "@/components/ui/ServerActionForm"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default async function ProductSettingsPage() {
  const [, categories, units] = await getProductSetup()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Product Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Maintain the categories and units used throughout purchasing, stock, and production.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Product Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <ServerActionForm action={createCategory} className="mb-5 flex gap-2">
              <div className="flex-1">
                <Label htmlFor="categoryName">Category name</Label>
                <Input id="categoryName" name="name" required placeholder="e.g. Finished Rice" />
              </div>
              <div className="flex-1">
                <Label htmlFor="categoryDescription">Description</Label>
                <Input id="categoryDescription" name="description" />
              </div>
              <Button type="submit" className="mt-6 bg-emerald-600 hover:bg-emerald-700">
                Add
              </Button>
            </ServerActionForm>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{category.description || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-emerald-600" />
              Units of Measure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ServerActionForm action={createUnit} className="mb-5 flex gap-2">
              <div className="flex-1">
                <Label htmlFor="unitName">Unit name</Label>
                <Input id="unitName" name="name" required placeholder="e.g. Kilogram" />
              </div>
              <div className="w-24">
                <Label htmlFor="unitSymbol">Symbol</Label>
                <Input id="unitSymbol" name="symbol" required placeholder="KG" />
              </div>
              <Button type="submit" className="mt-6 bg-emerald-600 hover:bg-emerald-700">
                Add
              </Button>
            </ServerActionForm>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Symbol</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {units.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium">{unit.name}</TableCell>
                    <TableCell>{unit.symbol}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
