"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Boxes, TrendingUp, ShieldCheck, DollarSign } from "lucide-react"

type MetricKey = "production" | "quality" | "yield" | "profit"

type DashboardOverview = {
  metrics: {
    totalProduction: number
    totalRiceOutput: number
    qualityScore: number
    yieldRatio: number
    profit: number
    totalRevenue: number
    totalCost: number
  }
  monthlyTrend: Array<{
    month: string
    production: number
    quality: number
    yieldRatio: number
    profit: number
  }>
  supplierBreakdown: Array<{
    name: string
    production: number
    quality: number
    profit: number
  }>
  varietyBreakdown: Array<{
    name: string
    production: number
    quality: number
    yieldRatio: number
  }>
  recentLots: Array<{
    lotNumber: string
    supplierName: string
    variety: string
    riceOutput: number
    qualityScore: number
    profit: number
  }>
}

type OwnerDashboardProps = {
  data: DashboardOverview
  ownerName: string
}

const cardConfig: Array<{
  key: MetricKey
  title: string
  description: string
  icon: typeof TrendingUp
  value: (data: DashboardOverview) => string
  subtext: (data: DashboardOverview) => string
  positive: (data: DashboardOverview) => boolean
}> = [
  {
    key: "production",
    title: "Total Production",
    description: "Overall rice output from completed lots",
    icon: Boxes,
    value: (data) => `${formatNumber(data.metrics.totalRiceOutput)} kg`,
    subtext: (data) => `${data.recentLots.length} lots in current view`,
    positive: () => true,
  },
  {
    key: "quality",
    title: "Quality Score",
    description: "Overall grading based on recovery quality",
    icon: ShieldCheck,
    value: (data) => `${data.metrics.qualityScore.toFixed(1)}%`,
    subtext: () => "Weighted from output quality mix",
    positive: () => true,
  },
  {
    key: "yield",
    title: "Yield Ratio",
    description: "Output versus paddy input efficiency",
    icon: TrendingUp,
    value: (data) => `${data.metrics.yieldRatio.toFixed(1)}%`,
    subtext: () => "Higher is better for mill efficiency",
    positive: () => true,
  },
  {
    key: "profit",
    title: "Profit / Loss",
    description: "Revenue less operating costs",
    icon: DollarSign,
    value: (data) => formatCurrency(data.metrics.profit),
    subtext: (data) => `Revenue ${formatCurrency(data.metrics.totalRevenue)} • Cost ${formatCurrency(data.metrics.totalCost)}`,
    positive: (data) => data.metrics.profit >= 0,
  },
]

export function OwnerDashboard({ data, ownerName }: OwnerDashboardProps) {
  const [activeMetric, setActiveMetric] = useState<MetricKey>("production")

  const activeCard = useMemo(
    () => cardConfig.find((card) => card.key === activeMetric) ?? cardConfig[0],
    [activeMetric]
  )

  const monthlyMax = Math.max(...data.monthlyTrend.map((item) => item.production), 1)
  const supplierMax = Math.max(...data.supplierBreakdown.map((item) => item.production), 1)
  const varietyMax = Math.max(...data.varietyBreakdown.map((item) => item.production), 1)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Production overview</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, {ownerName}. This page gives a quick executive picture of output, quality, efficiency, and profitability.
          </p>
        </div>
        <Badge variant="secondary" className="w-fit">
          Live from lot and production data
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cardConfig.map((card) => {
          const Icon = card.icon
          const isActive = card.key === activeMetric
          const value = card.value(data)
          const subtext = card.subtext(data)
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => setActiveMetric(card.key)}
              className={`rounded-xl border bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-500 ${
                isActive ? "border-emerald-500 ring-2 ring-emerald-100" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                <div className="rounded-full bg-emerald-50 p-2 text-emerald-600">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4 text-2xl font-semibold">{value}</div>
              <p className="mt-2 text-xs text-muted-foreground">{subtext}</p>
            </button>
          )
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.55fr_0.95fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{activeCard.title} trend</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">{activeCard.description}</p>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700">{activeMetric.toUpperCase()}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border bg-slate-50 p-4">
              <svg viewBox="0 0 360 180" className="h-48 w-full">
                <line x1="20" y1="150" x2="340" y2="150" stroke="#cbd5e1" strokeWidth="1" />
                <line x1="20" y1="30" x2="20" y2="150" stroke="#cbd5e1" strokeWidth="1" />
                {data.monthlyTrend.map((point, index) => {
                  const x = 30 + (index * 320) / Math.max(data.monthlyTrend.length - 1, 1)
                  const y = 150 - ((point[activeMetric === "profit" ? "profit" : activeMetric === "quality" ? "quality" : activeMetric === "yield" ? "yieldRatio" : "production"] / (activeMetric === "profit" ? Math.max(...data.monthlyTrend.map((item) => item.profit), 1) : activeMetric === "quality" ? 100 : activeMetric === "yield" ? 100 : monthlyMax)) * 110)
                  return <circle key={point.month} cx={x} cy={y} r="4" fill="#10b981" />
                })}
                <polyline
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  points={data.monthlyTrend
                    .map((point, index) => {
                      const x = 30 + (index * 320) / Math.max(data.monthlyTrend.length - 1, 1)
                      const y = 150 - ((point[activeMetric === "profit" ? "profit" : activeMetric === "quality" ? "quality" : activeMetric === "yield" ? "yieldRatio" : "production"] / (activeMetric === "profit" ? Math.max(...data.monthlyTrend.map((item) => item.profit), 1) : activeMetric === "quality" ? 100 : activeMetric === "yield" ? 100 : monthlyMax)) * 110)
                      return `${x},${y}`
                    })
                    .join(" ")}
                />
              </svg>
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                {data.monthlyTrend.map((point) => (
                  <span key={point.month}>{point.month}</span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top suppliers</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Comparison of output contribution and earnings by supplier</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.supplierBreakdown.map((item) => {
              const width = Math.max((item.production / supplierMax) * 100, 8)
              return (
                <div key={item.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-muted-foreground">{formatNumber(item.production)} kg</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200">
                    <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${width}%` }} />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Variety mix</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">How different paddy varieties perform on efficiency and quality</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.varietyBreakdown.map((item) => {
              const width = Math.max((item.production / varietyMax) * 100, 8)
              return (
                <div key={item.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-muted-foreground">{item.quality.toFixed(1)}% quality</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200">
                    <div className="h-2 rounded-full bg-amber-500" style={{ width: `${width}%` }} />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent lots</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Fast view of most recent lots with output and margin</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentLots.map((lot) => (
                <div key={lot.lotNumber} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                  <div>
                    <p className="font-medium">{lot.lotNumber}</p>
                    <p className="text-xs text-muted-foreground">{lot.supplierName} • {lot.variety}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatNumber(lot.riceOutput)} kg</p>
                    <p className="text-xs text-muted-foreground">{lot.qualityScore.toFixed(1)}% • {formatCurrency(lot.profit)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function formatNumber(value: number) {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 0,
  })
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(value)
}
