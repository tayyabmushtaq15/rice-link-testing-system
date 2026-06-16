import { getPaddyLots } from "@/actions/paddyLots"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { FileText, Plus, Pencil, Eye } from "lucide-react"
import Link from "next/link"
import LotSearch from "./LotSearch"

export default async function LotsPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>
}) {
  const query = (await searchParams).query || ""
  const lots = await getPaddyLots(query)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Paddy Lots</h1>
        <Link href="/dashboard/lots/new" className={buttonVariants({ className: "bg-emerald-600 hover:bg-emerald-700" })}>
          <Plus className="mr-2 h-4 w-4" />
          Add Paddy Lot
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              Recent Lots
            </CardTitle>
            <div className="w-72">
              <LotSearch initialQuery={query} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lot Number</TableHead>
                <TableHead>Mill</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Variety</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lots.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No paddy lots found.
                  </TableCell>
                </TableRow>
              ) : (
                lots.map((lot) => (
                  <TableRow key={lot.id}>
                    <TableCell className="font-medium text-emerald-700">
                      <Link href={`/dashboard/lots/${lot.id}`} className="hover:underline">
                        {lot.lotNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{lot.mill.name}</TableCell>
                    <TableCell>{lot.supplierName}</TableCell>
                    <TableCell>{lot.variety}</TableCell>
                    <TableCell>{lot.weight} KG</TableCell>
                    <TableCell>
                      <Badge variant={
                        lot.status === "OPEN" ? "default" :
                        lot.status === "PROCESSING" ? "secondary" : "outline"
                      } className={
                        lot.status === "OPEN" ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none" : ""
                      }>
                        {lot.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/dashboard/lots/${lot.id}`} className={buttonVariants({ variant: "ghost", size: "icon" })}>
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link href={`/dashboard/lots/${lot.id}/edit`} className={buttonVariants({ variant: "ghost", size: "icon" })}>
                          <Pencil className="h-4 w-4 text-emerald-600" />
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
