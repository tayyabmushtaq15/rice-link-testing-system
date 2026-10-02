"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useTransition, useState, useEffect } from "react"

type EntitySearchProps = {
  initialQuery: string
  placeholder?: string
}

export function EntitySearch({ initialQuery, placeholder = "Search..." }: EntitySearchProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [query, setQuery] = useState(initialQuery)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query === initialQuery) return

      const params = new URLSearchParams(searchParams)
      if (query) {
        params.set("query", query)
      } else {
        params.delete("query")
      }
      params.delete("page")

      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`)
      })
    }, 300)

    return () => clearTimeout(timer)
  }, [query, router, pathname, searchParams, initialQuery])

  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        className="bg-white pl-8"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {isPending && (
        <span className="absolute right-3 top-2.5 flex h-4 w-4">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-500"></span>
        </span>
      )}
    </div>
  )
}
