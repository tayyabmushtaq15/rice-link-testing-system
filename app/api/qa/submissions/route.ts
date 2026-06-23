import { NextResponse } from "next/server"
import { getSubmittedReports } from "@/actions/qa"

export async function GET() {
  try {
    const reports = await getSubmittedReports()
    return NextResponse.json({ ok: true, reports })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ ok: false, error: errorMessage }, { status: 403 })
  }
}
