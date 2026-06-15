import { NextRequest, NextResponse } from "next/server"
import { getCoachesByClub } from "@/app/actions/coaches"

export async function GET(req: NextRequest) {
  const clubId = Number(req.nextUrl.searchParams.get("clubId"))
  if (!clubId || isNaN(clubId)) {
    return NextResponse.json({ error: "Missing clubId" }, { status: 400 })
  }
  try {
    const coaches = await getCoachesByClub(clubId)
    return NextResponse.json(coaches)
  } catch {
    return NextResponse.json({ error: "Failed to fetch coaches" }, { status: 500 })
  }
}
