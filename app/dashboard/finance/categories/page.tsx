import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { getCategories } from "@/actions/finance/categories"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CategoryTable } from "@/components/finance/categories/CategoryTable"
import { EntitySearch } from "@/components/ui/EntitySearch"

export default async function FinanceCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; page?: string; sort?: string; dir?: string }>
}) {
  const session = await auth()
  const allowedRoles = ["ADMIN", "FINANCE_MANAGER"]

  if (!session?.user?.role || !allowedRoles.includes(session.user.role as string)) {
    redirect("/dashboard")
  }

  const params = await searchParams
  const query = params.query || ""
  const basePath = "/dashboard/finance/categories"
  const list = await getCategories({ search: query, page: params.page, sort: params.sort, dir: params.dir })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expense Categories</h1>
          <p className="text-sm text-muted-foreground">
            Manage expense categories for organizing transactions.
          </p>
        </div>
        <Link href="/dashboard/finance/categories/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </Link>
      </div>

      <div className="w-72">
        <EntitySearch initialQuery={query} placeholder="Search categories..." />
      </div>

      <CategoryTable
        categories={list.items}
        total={list.total}
        page={list.page}
        pageSize={list.pageSize}
        totalPages={list.totalPages}
        sort={list.sort}
        dir={list.dir}
        basePath={basePath}
        searchParams={params}
      />
    </div>
  )
}
