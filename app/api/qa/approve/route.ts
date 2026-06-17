import { NextResponse } from "next/server"
import { approveReport } from "@/actions/qa"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const updated = await approveReport(body)
    return NextResponse.json({ ok: true, report: updated })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 })
  }
}
