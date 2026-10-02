import { getSubmittedReports } from "@/actions/qa"
import QAList from "./QAList"

export default async function QADashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; sort?: string; dir?: string }>
}) {
  const params = await searchParams
  const list = await getSubmittedReports({ page: params.page, sort: params.sort, dir: params.dir })

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">QA Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Review submitted reports, track approved or rejected submissions, and manage follow-up
          actions from one place.
        </p>
      </div>

      <QAList
        reports={list.items}
        statusCounts={list.statusCounts}
        total={list.total}
        page={list.page}
        pageSize={list.pageSize}
        totalPages={list.totalPages}
        sort={list.sort}
        dir={list.dir}
        basePath="/dashboard/qa"
        searchParams={params}
      />
    </div>
  )
}
