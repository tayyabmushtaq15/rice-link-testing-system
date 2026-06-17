import { NextResponse } from "next/server"
import { getSubmittedReports } from "@/actions/qa"

export async function GET() {
  try {
    const reports = await getSubmittedReports()
    return NextResponse.json({ ok: true, reports })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 403 })
  }
}
