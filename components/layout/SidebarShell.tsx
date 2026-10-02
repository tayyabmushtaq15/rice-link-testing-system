"use client"

import { X } from "lucide-react"
import { useSidebar } from "./SidebarProvider"

export function SidebarShell({ children }: { children: React.ReactNode }) {
  const { isOpen, close } = useSidebar()

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-64 shrink-0 flex-col gap-4 overflow-y-auto bg-slate-900 p-4 text-slate-100 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          type="button"
          onClick={close}
          className="self-end rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
        {children}
      </aside>
    </>
  )
}
