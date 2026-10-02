import Link from "next/link"
import { buildListHref } from "@/lib/listQuery"

type PaginationProps = {
  page: number
  pageSize: number
  total: number
  totalPages: number
  basePath: string
  searchParams: Record<string, string | string[] | undefined>
}

function PageLink({
  href,
  disabled,
  children,
}: {
  href: string
  disabled: boolean
  children: React.ReactNode
}) {
  if (disabled) {
    return <span className="cursor-not-allowed px-2 py-1 text-sm text-muted-foreground/50">{children}</span>
  }
  return (
    <Link href={href} className="rounded-md px-2 py-1 text-sm text-emerald-700 hover:bg-emerald-50">
      {children}
    </Link>
  )
}

export function Pagination({ page, pageSize, total, totalPages, basePath, searchParams }: PaginationProps) {
  if (total === 0) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const href = (targetPage: number) => buildListHref(basePath, searchParams, { page: targetPage })

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
      <p className="text-sm text-muted-foreground">
        Showing {from.toLocaleString()}–{to.toLocaleString()} of {total.toLocaleString()}
      </p>
      <div className="flex items-center gap-1">
        <PageLink href={href(1)} disabled={page <= 1}>
          First
        </PageLink>
        <PageLink href={href(page - 1)} disabled={page <= 1}>
          Prev
        </PageLink>
        <span className="px-2 text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <PageLink href={href(page + 1)} disabled={page >= totalPages}>
          Next
        </PageLink>
        <PageLink href={href(totalPages)} disabled={page >= totalPages}>
          Last
        </PageLink>
      </div>
    </div>
  )
}
