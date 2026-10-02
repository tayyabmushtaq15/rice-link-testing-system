"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { usePathname } from "next/navigation"

type SidebarContextValue = {
  isOpen: boolean
  toggle: () => void
  close: () => void
}

const SidebarContext = createContext<SidebarContextValue | null>(null)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  return (
    <SidebarContext.Provider
      value={{
        isOpen,
        toggle: () => setIsOpen((value) => !value),
        close: () => setIsOpen(false),
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) throw new Error("useSidebar must be used within a SidebarProvider")
  return context
}
