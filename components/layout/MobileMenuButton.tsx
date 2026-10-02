"use client"

import { Menu } from "lucide-react"
import { useSidebar } from "./SidebarProvider"

export function MobileMenuButton() {
  const { toggle } = useSidebar()

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
      aria-label="Open menu"
    >
      <Menu className="h-5 w-5" />
    </button>
  )
}
