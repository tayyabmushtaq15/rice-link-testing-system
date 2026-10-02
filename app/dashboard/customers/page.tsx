import Link from "next/link"
import { getCustomers, toggleCustomer } from "@/actions/customers"
import { UsersRound, Plus, Pencil } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EntitySearch } from "@/components/ui/EntitySearch"
import { DeactivateButton } from "@/components/ui/DeactivateButton"
import { SortableTableHead } from "@/components/ui/SortableTableHead"
import { Pagination } from "@/components/ui/Pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; page?: string; sort?: string; dir?: string }>
}) {
  const params = await searchParams
  const query = params.query || ""
  const basePath = "/dashboard/customers"
  const list = await getCustomers({ search: query, page: params.page, sort: params.sort, dir: params.dir })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="mt-1 text-muted-foreground">
            Manage buyers, contact details, and customer accounts.
          </p>
        </div>
        <Link
          href="/dashboard/customers/new"
          className={buttonVariants({ className: "bg-emerald-600 hover:bg-emerald-700" })}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Link>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UsersRound className="h-5 w-5 text-emerald-600" />
              Customer Directory
            </CardTitle>
            <div className="w-72">
              <EntitySearch initialQuery={query} placeholder="Search customers..." />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead
                  label="Name"
                  sortKey="name"
                  currentSort={list.sort}
                  currentDir={list.dir}
                  basePath={basePath}
                  searchParams={params}
                />
                <TableHead>Contact</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No customers yet. Add a customer before creating sales invoices.
                  </TableCell>
                </TableRow>
              ) : (
                list.items.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/customers/${customer.id}/edit`}
                        className="text-emerald-700 hover:underline"
                      >
                        {customer.name}
                      </Link>
                    </TableCell>
                    <TableCell>{customer.contactName || "-"}</TableCell>
                    <TableCell>{customer.phone || "-"}</TableCell>
                    <TableCell>{customer.email || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/dashboard/customers/${customer.id}/edit`}
                          className={buttonVariants({ variant: "outline", size: "icon" })}
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <DeactivateButton
                          itemName={customer.name}
                          action={toggleCustomer.bind(null, customer.id, false)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Pagination
            page={list.page}
            pageSize={list.pageSize}
            total={list.total}
            totalPages={list.totalPages}
            basePath={basePath}
            searchParams={params}
          />
        </CardContent>
      </Card>
    </div>
  )
}
