"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useTransition, useState, useEffect } from "react"

export default function MillSearch({ initialQuery }: { initialQuery: string }) {
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
      
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`)
      })
    }, 300) // Debounce search
    
    return () => clearTimeout(timer)
  }, [query, router, pathname, searchParams, initialQuery])

  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search mills..."
        className="pl-8 bg-white"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {isPending && <span className="absolute right-3 top-2.5 flex h-4 w-4">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
      </span>}
    </div>
  )
}
