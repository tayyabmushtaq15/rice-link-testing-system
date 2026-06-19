import Link from "next/link"
import { Home, Users, FileText, Settings, Factory, Building2, ClipboardList } from "lucide-react"
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

        <Link href="/dashboard/users" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 transition-colors">
          <Users className="h-5 w-5" />
          Users
        </Link>
      </nav>
    </aside>
  )
}
