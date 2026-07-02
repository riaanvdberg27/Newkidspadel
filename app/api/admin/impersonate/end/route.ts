import { NextResponse } from "next/server"
import { endImpersonation } from "@/app/actions/impersonation"

export async function POST() {
  await endImpersonation()
  return NextResponse.redirect(new URL("/admin", process.env.BETTER_AUTH_URL ?? "http://localhost:3000"))
}
