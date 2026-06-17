import { getSubmittedReports } from "@/actions/qa"
import QAList from "./QAList"

export default async function QADashboardPage() {
  const reports = await getSubmittedReports()

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">QA Dashboard</h1>
      <p className="text-sm text-muted-foreground mt-2">Submitted Reports / Pending Reviews</p>
      <div className="mt-6">
        {/* @ts-expect-error Server component passes plain data to client component */}
        <QAList reports={reports} />
      </div>
    </div>
  )
}
