import Link from "next/link"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { TableHead } from "@/components/ui/table"
import { buildListHref, type SortDir } from "@/lib/listQuery"

type SortableTableHeadProps = {
  label: string
  sortKey: string
  currentSort: string
  currentDir: SortDir
  basePath: string
  searchParams: Record<string, string | string[] | undefined>
  defaultDir?: SortDir
  className?: string
}

export function SortableTableHead({
  label,
  sortKey,
  currentSort,
  currentDir,
  basePath,
  searchParams,
  defaultDir = "asc",
  className,
}: SortableTableHeadProps) {
  const isActive = currentSort === sortKey
  const nextDir: SortDir = isActive ? (currentDir === "asc" ? "desc" : "asc") : defaultDir
  const href = buildListHref(basePath, searchParams, { sort: sortKey, dir: nextDir, page: 1 })
  const Icon = isActive ? (currentDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown

  return (
    <TableHead className={className}>
      <Link
        href={href}
        className={`inline-flex items-center gap-1 hover:text-foreground ${
          isActive ? "font-semibold text-foreground" : "text-muted-foreground"
        }`}
      >
        {label}
        <Icon className="h-3.5 w-3.5" />
      </Link>
    </TableHead>
  )
}
