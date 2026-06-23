import { getTemplates } from "@/actions/templates"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, LayoutTemplate } from "lucide-react"
import Link from "next/link"
import { ToggleStatusButton } from "@/components/templates/ToggleStatusButton"

export default async function TemplatesPage() {
  const templates = await getTemplates()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Report Templates</h1>
        <Link href="/dashboard/templates/new" className={buttonVariants({ className: "bg-emerald-600 hover:bg-emerald-700" })}>
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5 text-emerald-600" />
            Dynamic Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Fields Count</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No report templates found. Click &quot;Create Template&quot; to build one.
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">
                      {template.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {template.description || "-"}
                    </TableCell>
                    <TableCell>{template._count.fields}</TableCell>
                    <TableCell>
                      <ToggleStatusButton id={template.id} isActive={template.isActive} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/templates/${template.id}/edit`} className={buttonVariants({ variant: "ghost", size: "icon" })}>
                        <Pencil className="h-4 w-4 text-emerald-600" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
