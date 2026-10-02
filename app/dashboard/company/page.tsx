import { getCompanyProfile, saveCompanyProfile } from "@/actions/companyProfile"
import { Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ServerActionForm } from "@/components/ui/ServerActionForm"

export default async function CompanyPage() {
  const company = await getCompanyProfile()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Company Profile</h1>
        <p className="mt-1 text-muted-foreground">
          These details will drive invoices, PDFs, and operational documents.
        </p>
      </div>
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-emerald-600" />
            Business Identity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ServerActionForm
            key={company?.updatedAt.getTime() ?? "new"}
            action={saveCompanyProfile}
            className="grid gap-5 md:grid-cols-2"
          >
            <div>
              <Label htmlFor="name">Company name *</Label>
              <Input id="name" name="name" required defaultValue={company?.name || ""} />
            </div>
            <div>
              <Label htmlFor="legalName">Legal name</Label>
              <Input id="legalName" name="legalName" defaultValue={company?.legalName || ""} />
            </div>
            <div>
              <Label htmlFor="businessType">Business type</Label>
              <Input
                id="businessType"
                name="businessType"
                defaultValue={company?.businessType || "Rice Mill & Trading"}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={company?.phone || ""} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={company?.email || ""} />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" defaultValue={company?.city || ""} />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" defaultValue={company?.address || ""} />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input id="country" name="country" defaultValue={company?.country || "Pakistan"} />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" name="currency" defaultValue={company?.currency || "PKR"} />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                Save Company Profile
              </Button>
            </div>
          </ServerActionForm>
        </CardContent>
      </Card>
    </div>
  )
}
