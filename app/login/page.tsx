import { AuthError } from "next-auth"
import { redirect } from "next/navigation"
import { signIn } from "@/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Factory } from "lucide-react"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg border">
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
            <Factory className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Ricely ERP</h1>
          <p className="text-sm text-muted-foreground">Sign in to your account</p>
        </div>

        <form
          action={async (formData) => {
            "use server"
            try {
              await signIn("credentials", formData)
            } catch (err) {
              if (err instanceof AuthError) redirect("/login?error=invalid")
              throw err
            }
          }}
          className="space-y-4"
        >
          {error && (
            <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              Invalid email or password.
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="Enter your email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              placeholder="Enter your password"
            />
          </div>
          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
            Sign In
          </Button>
        </form>
      </div>
    </div>
  )
}
