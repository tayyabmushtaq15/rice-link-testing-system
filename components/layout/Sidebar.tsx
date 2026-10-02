import Link from "next/link"
import {
  BarChart3,
  Banknote,
  BookOpen,
  Boxes,
  Building2,
  ClipboardCheck,
  FileText,
  Factory,
  Home,
  IdCard,
  Landmark,
  Package,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  UsersRound,
  Wallet,
  Warehouse,
} from "lucide-react"
import { auth } from "@/auth"
import { SidebarShell } from "./SidebarShell"

const primaryLinks = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/dashboard/purchases", label: "Purchases", icon: ShoppingCart },
  { href: "/dashboard/production", label: "Production", icon: Factory },
  { href: "/dashboard/sales", label: "Sales", icon: Wallet },
  { href: "/dashboard/dispatch", label: "Dispatch", icon: Truck },
  { href: "/dashboard/stock", label: "Stock", icon: Package },
  { href: "/dashboard/products", label: "Products", icon: Boxes },
  { href: "/dashboard/customers", label: "Customers", icon: UsersRound },
  { href: "/dashboard/suppliers", label: "Suppliers", icon: Truck },
  { href: "/dashboard/godowns", label: "Godowns", icon: Warehouse },
  { href: "/dashboard/finance/expenses", label: "Expenses", icon: Wallet },
  { href: "/dashboard/finance", label: "Accounting", icon: BookOpen },
  { href: "/dashboard/finance/ledger", label: "General Ledger", icon: Landmark },
  { href: "/dashboard/finance/employees", label: "Employees", icon: IdCard },
  { href: "/dashboard/finance/salaries", label: "Salaries", icon: Banknote },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
  { href: "/dashboard/company", label: "Company Profile", icon: Building2 },
]

export async function Sidebar() {
  const session = await auth()
  const role = session?.user?.role
  const isAdmin = role === "ADMIN"
  const canFinance = isAdmin || role === "FINANCE_MANAGER"
  const canOperate = isAdmin || role === "ANALYST" || role === "MILL_OWNER"

  return (
    <SidebarShell>
      <div className="mb-4 flex items-center gap-2 px-2 text-xl font-bold text-emerald-400">
        <Factory className="h-6 w-6" />
        <span>Ricely ERP</span>
      </div>
      <nav className="flex flex-col gap-1">
        {primaryLinks.map(({ href, label, icon: Icon }) => {
          const financeOnly =
            label === "Expenses" ||
            label === "Accounting" ||
            label === "General Ledger" ||
            label === "Employees" ||
            label === "Salaries"
          const adminOnly = [
            "Products",
            "Customers",
            "Suppliers",
            "Godowns",
            "Company Profile",
          ].includes(label)
          if (
            (financeOnly && !canFinance) ||
            (adminOnly && !isAdmin) ||
            (label === "Purchases" && !canOperate) ||
            (label === "Production" && !canOperate)
          )
            return null
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-slate-800"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          )
        })}
      </nav>

      <details className="group rounded-md border-t border-slate-700 pt-3">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-3 py-2 text-sm text-slate-400 hover:text-white">
          <Settings className="h-4 w-4" />
          Legacy Operations
        </summary>
        <div className="mt-1 flex flex-col gap-1 pl-3">
          {canOperate && (
            <Link
              href="/dashboard/lots"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <FileText className="h-4 w-4" />
              Paddy Lots
            </Link>
          )}
          {canOperate && (
            <Link
              href="/dashboard/reports"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <ClipboardCheck className="h-4 w-4" />
              Quality Reports
            </Link>
          )}
          {(isAdmin || role === "QA") && (
            <Link
              href="/dashboard/qa"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <ClipboardCheck className="h-4 w-4" />
              QA Review
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/dashboard/mills"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <Building2 className="h-4 w-4" />
              Mills
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/dashboard/templates"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <FileText className="h-4 w-4" />
              Report Templates
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/dashboard/users"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <Users className="h-4 w-4" />
              Users
            </Link>
          )}
        </div>
      </details>
    </SidebarShell>
  )
}
