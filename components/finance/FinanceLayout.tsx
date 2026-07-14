import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/finance/dashboard", label: "Dashboard" },
  { href: "/finance/income", label: "Income" },
  { href: "/finance/expenses", label: "Expenses" },
  { href: "/finance/categories", label: "Categories" },
  { href: "/finance/salaries", label: "Salaries" },
  { href: "/finance/budgets", label: "Budgets" },
  { href: "/finance/reports", label: "Reports" },
]

export function FinanceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-3 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>
      {children}
    </div>
  )
}
