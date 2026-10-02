import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ArrowLeft, Factory, FileCheck } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default async function ProductionBatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const batch = await prisma.productionBatch.findUnique({
    where: { id: (await params).id },
    include: {
      inputGodown: true,
      outputGodown: true,
      inputs: { include: { product: { include: { unit: true } } } },
      outputs: { include: { product: { include: { unit: true } } } },
      costs: true,
      reports: { include: { template: { select: { name: true } } } },
    },
  })
  if (!batch) notFound()
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/production"
          className={buttonVariants({ variant: "outline", size: "icon" })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{batch.batchNo}</h1>
          <p className="mt-1 text-muted-foreground">
            Production batch · {batch.productionDate.toLocaleDateString()}
          </p>
        </div>
        <Badge className="ml-auto" variant={batch.status === "COMPLETED" ? "secondary" : "outline"}>
          {batch.status.replaceAll("_", " ")}
        </Badge>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5 text-blue-600" />
              Inputs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">Source: {batch.inputGodown.name}</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Cost</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batch.inputs.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>{line.product.name}</TableCell>
                    <TableCell>
                      {line.quantity.toString()} {line.product.unit.symbol}
                    </TableCell>
                    <TableCell>
                      {line.unitCost ? `PKR ${Number(line.unitCost).toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      PKR{" "}
                      {(Number(line.quantity) * Number(line.unitCost || 0)).toLocaleString(
                        undefined,
                        { maximumFractionDigits: 0 },
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Outputs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">
              Destination: {batch.outputGodown.name}
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Cost</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batch.outputs.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>{line.product.name}</TableCell>
                    <TableCell>
                      {line.quantity.toString()} {line.product.unit.symbol}
                    </TableCell>
                    <TableCell>
                      {line.unitCost ? `PKR ${Number(line.unitCost).toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      PKR{" "}
                      {(Number(line.quantity) * Number(line.unitCost || 0)).toLocaleString(
                        undefined,
                        { maximumFractionDigits: 0 },
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Production Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Total input</p>
            <p className="text-xl font-semibold">{batch.totalInput.toString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total output</p>
            <p className="text-xl font-semibold">{batch.totalOutput.toString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Production cost</p>
            <p className="text-xl font-semibold">PKR {Number(batch.totalCost).toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>
      {batch.reports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-blue-600" />
              Quality Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {batch.reports.map((report) => (
                <li key={report.id} className="flex items-center justify-between text-sm">
                  <Link
                    href={`/dashboard/reports/${report.id}`}
                    className="font-medium text-blue-700 hover:underline"
                  >
                    {report.template.name}
                  </Link>
                  <Badge variant={report.status === "APPROVED" ? "default" : "secondary"}>
                    {report.status}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
