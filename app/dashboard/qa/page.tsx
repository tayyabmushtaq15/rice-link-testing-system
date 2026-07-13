import { getSubmittedReports } from "@/actions/qa"
import QAList from "./QAList"

export default async function QADashboardPage() {
  const reports = await getSubmittedReports()

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">QA Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Review submitted reports, track approved or rejected submissions, and manage follow-up actions from one place.
        </p>
      </div>

      <QAList reports={reports} />
    </div>
  )
}
