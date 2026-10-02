export const DEFAULT_PAGE_SIZE = 25

export type SortDir = "asc" | "desc"

export type RawListParams = { page?: string; sort?: string; dir?: string }

export type ParsedListQuery<TSort extends string> = {
  page: number
  sort: TSort
  dir: SortDir
}

export function parseListQuery<TSort extends string>(
  raw: RawListParams,
  opts: { allowedSorts: readonly TSort[]; defaultSort: TSort; defaultDir?: SortDir },
): ParsedListQuery<TSort> {
  const rawPage = Number(raw.page)
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1
  const sort = (opts.allowedSorts as readonly string[]).includes(raw.sort ?? "")
    ? (raw.sort as TSort)
    : opts.defaultSort
  const dir: SortDir = raw.dir === "asc" || raw.dir === "desc" ? raw.dir : (opts.defaultDir ?? "desc")
  return { page, sort, dir }
}

export function clampPage(page: number, totalPages: number) {
  if (totalPages <= 0) return 1
  return Math.min(Math.max(page, 1), totalPages)
}

export type ListResult<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * Runs count() first so an out-of-range `page` (e.g. a filter just narrowed the result set)
 * clamps to the last valid page instead of returning an empty result.
 */
export async function paginate<T>(
  countFn: () => Promise<number>,
  findFn: (args: { skip: number; take: number }) => Promise<T[]>,
  requestedPage: number,
  pageSize: number = DEFAULT_PAGE_SIZE,
): Promise<ListResult<T>> {
  const total = await countFn()
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = clampPage(requestedPage, totalPages)
  const items = await findFn({ skip: (page - 1) * pageSize, take: pageSize })
  return { items, total, page, pageSize, totalPages }
}

type OrderByClause = Record<string, unknown>

/**
 * Appends a tiebreaker chain to a primary orderBy so ties (very common on day-granularity date
 * columns) always resolve deterministically, same direction as the primary so "newest first"
 * stays coherent — this is what makes a freshly created row reliably land at the top instead of
 * appearing to shift position between reloads.
 */
export function withTiebreak(
  primary: OrderByClause | OrderByClause[],
  dir: SortDir,
  tiebreak: OrderByClause[] = [{ createdAt: dir }, { id: dir }],
): OrderByClause[] {
  const primaryArr = Array.isArray(primary) ? primary : [primary]
  return [...primaryArr, ...tiebreak]
}

/**
 * Builds a URL for a list page that preserves every current search param except the ones
 * explicitly overridden (a value of `undefined` removes that param entirely).
 */
export function buildListHref(
  basePath: string,
  currentParams: Record<string, string | string[] | undefined>,
  overrides: Record<string, string | number | undefined>,
): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(currentParams)) {
    if (typeof value === "string") params.set(key, value)
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) params.delete(key)
    else params.set(key, String(value))
  }
  const qs = params.toString()
  return qs ? `${basePath}?${qs}` : basePath
}
