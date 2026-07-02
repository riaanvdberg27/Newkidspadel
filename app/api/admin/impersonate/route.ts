import { type NextRequest, NextResponse } from "next/server"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { startImpersonation } from "@/app/actions/impersonation"
import type { ImpersonationMode } from "@/lib/impersonation"

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { parentId, mode = "view-only", reason } = (await req.json()) as {
    parentId: string
    mode?: ImpersonationMode
    reason?: string
  }

  if (!parentId) {
    return NextResponse.json({ error: "parentId required" }, { status: 400 })
  }

  const result = await startImpersonation(parentId, mode, reason)

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
