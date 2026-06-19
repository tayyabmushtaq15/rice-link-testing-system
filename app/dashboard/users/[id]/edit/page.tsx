import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getUser } from "@/actions/users"
import { buttonVariants } from "@/components/ui/button"
import { UserForm } from "@/components/users/UserForm"

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getUser(id)

  if (!user) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/users" className={buttonVariants({ variant: "outline", size: "icon" })}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Edit User</h1>
      </div>

      <UserForm
        initialData={{
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }}
      />
    </div>
  )
}
