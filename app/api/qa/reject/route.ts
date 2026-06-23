import { NextResponse } from "next/server"
import { rejectReport } from "@/actions/qa"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const updated = await rejectReport(body)
    return NextResponse.json({ ok: true, report: updated })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ ok: false, error: errorMessage }, { status: 400 })
  }
}
