import Link from "next/link"
import { Home, Users, FileText, Settings, Factory, Building2, ClipboardList, Wallet, ChevronRight } from "lucide-react"
import { auth } from "@/auth"

export async function Sidebar() {
  const session = await auth()
  const isAdmin = session?.user?.role === "ADMIN"

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 min-h-screen p-4 flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-8 px-2 font-bold text-xl text-emerald-400">
        <Factory className="h-6 w-6" />
        <span>Rice Mill Pro</span>
      </div>
      
      <nav className="flex flex-col gap-2">
        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 transition-colors">
          <Home className="h-5 w-5" />
          Dashboard
        </Link>
        <Link href="/dashboard/production" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 transition-colors">
          <FileText className="h-5 w-5" />
          Production
        </Link>
        <Link href="/dashboard/quality" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 transition-colors">
          <Settings className="h-5 w-5" />
          Quality Control
        </Link>
        
        {(isAdmin || session?.user?.role === "ANALYST") && (
          <Link href="/dashboard/lots" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 transition-colors">
            <FileText className="h-5 w-5" />
            Paddy Lots
          </Link>
        )}

        {(isAdmin || session?.user?.role === "ANALYST") && (
          <Link href="/dashboard/reports" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 transition-colors">
            <ClipboardList className="h-5 w-5" />
            Report Entries
          </Link>
        )}

        {(isAdmin || session?.user?.role === "QA") && (
          <Link href="/dashboard/qa" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 transition-colors">
            <ClipboardList className="h-5 w-5" />
            QA Dashboard
          </Link>
        )}

        {isAdmin && (
          <Link href="/dashboard/mills" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 transition-colors">
            <Building2 className="h-5 w-5" />
            Mills
          </Link>
        )}

        {isAdmin && (
          <Link href="/dashboard/templates" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 transition-colors">
            <FileText className="h-5 w-5" />
            Report Templates
          </Link>
        )}

        {(isAdmin || session?.user?.role === "FINANCE_MANAGER") && (
          <details className="group rounded-md">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 rounded-md hover:bg-slate-800 transition-colors">
              <span className="flex items-center gap-3">
                <Wallet className="h-5 w-5" />
                Finance
              </span>
              <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
            </summary>
            <div className="ml-6 mt-1 flex flex-col gap-1 border-l border-slate-700 pl-3 py-1">
              <Link href="/dashboard/finance" className="rounded-md px-2 py-1.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white">
                Overview
              </Link>
              <Link href="/dashboard/finance/income" className="rounded-md px-2 py-1.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white">
                Income
              </Link>
              <Link href="/dashboard/finance/expenses" className="rounded-md px-2 py-1.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white">
                Expenses
              </Link>
              <Link href="/dashboard/finance/categories" className="rounded-md px-2 py-1.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white">
                Categories
              </Link>
              <Link href="/dashboard/finance/salaries" className="rounded-md px-2 py-1.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white">
                Salaries
              </Link>
              <Link href="/dashboard/finance/budgets" className="rounded-md px-2 py-1.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white">
                Budgets
              </Link>
              <Link href="/dashboard/finance/reports" className="rounded-md px-2 py-1.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white">
                Reports
              </Link>
            </div>
          </details>
        )}

        <Link href="/dashboard/users" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 transition-colors">
          <Users className="h-5 w-5" />
          Users
        </Link>
      </nav>
    </aside>
  )
}
