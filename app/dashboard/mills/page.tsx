import { getMills } from "@/actions/mills"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Building2, Plus, Pencil, Trash2 } from "lucide-react"
import Link from "next/link"
import MillSearch from "./MillSearch"
import DeleteMillButton from "./DeleteMillButton"

export default async function MillsPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>
}) {
  const query = (await searchParams).query || ""
  const mills = await getMills(query)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Mills Management</h1>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
          <Link href="/dashboard/mills/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Mill
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-600" />
              Registered Mills
            </CardTitle>
            <div className="w-72">
              <MillSearch initialQuery={query} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mill Name</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mills.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No mills found.
                  </TableCell>
                </TableRow>
              ) : (
                mills.map((mill) => (
                  <TableRow key={mill.id}>
                    <TableCell className="font-medium">
                      <Link href={`/dashboard/mills/${mill.id}`} className="hover:underline text-emerald-700">
                        {mill.name}
                      </Link>
                    </TableCell>
                    <TableCell>{mill.ownerName}</TableCell>
                    <TableCell>{mill.phone || "-"}</TableCell>
                    <TableCell>{mill.email || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" asChild>
                          <Link href={`/dashboard/mills/${mill.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <DeleteMillButton id={mill.id} millName={mill.name} />
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
