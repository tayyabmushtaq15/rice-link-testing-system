import Link from "next/link"
import { Plus } from "lucide-react"
import { getUsers } from "@/actions/users"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import UserTable from "@/components/users/UserTable"

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; sort?: string; dir?: string }>
}) {
  const params = await searchParams
  const basePath = "/dashboard/users"
  const list = await getUsers({ page: params.page, sort: params.sort, dir: params.dir })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <Link
          href="/dashboard/users/new"
          className={buttonVariants({ className: "bg-emerald-600 hover:bg-emerald-700" })}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <UserTable
            users={list.items}
            total={list.total}
            page={list.page}
            pageSize={list.pageSize}
            totalPages={list.totalPages}
            sort={list.sort}
            dir={list.dir}
            basePath={basePath}
            searchParams={params}
          />
        </CardContent>
      </Card>
    </div>
  )
}
