/**
 * POST /api/netcash/shop-pay
 *
 * Builds the Netcash Pay Now form fields for an existing shop order.
 * Mirrors /api/netcash/pay but scoped to shopOrders instead of enrollments.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { buildNetcashPaymentForShopOrder } from "@/app/actions/shop"

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { orderId?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (!body.orderId) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 })
  }

  try {
    const { netcashUrl, formFields } = await buildNetcashPaymentForShopOrder(body.orderId)
    return NextResponse.json({ netcashUrl, formFields })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[netcash-shop-pay] error:", message)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
