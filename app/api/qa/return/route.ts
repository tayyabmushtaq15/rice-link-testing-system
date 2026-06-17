import { NextResponse } from "next/server"
import { returnToAnalyst } from "@/actions/qa"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const updated = await returnToAnalyst(body)
    return NextResponse.json({ ok: true, report: updated })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 })
  }
}
