/**
 * POST /api/netcash/pay
 *
 * Builds and returns the Netcash Pay Now form fields as JSON.
 * Accepts either:
 *   - Legacy single-enrollment params (referenceNumber + enrollmentId + packagePrice …)
 *   - Cart checkout params (orderReference + totalAmount + childCount …)
 *
 * The caller receives { netcashUrl, formFields } and auto-submits a hidden
 * HTML form to POST directly to Netcash Pay Now.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { buildNetcashPaymentForEnrollment } from "@/app/actions/enrollment"
import { NETCASH_PAY_NOW_URL, buildNetcashPayNowFields } from "@/lib/netcash"

export async function POST(req: NextRequest) {
  // Require an authenticated session
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: Record<string, unknown>

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const serviceKey = process.env.NETCASH_SERVICE_KEY ?? ""
  if (!serviceKey) {
    console.error("[netcash-pay] NETCASH_SERVICE_KEY is not set")
    return NextResponse.json({ error: "Payment gateway is not configured" }, { status: 503 })
  }

  // ── Cart checkout (new multi-child path) ──────────────────────────────────
  if (body.orderReference) {
    const orderReference = body.orderReference as string
    const totalAmount    = body.totalAmount as number
    const parentName     = (body.parentName as string | undefined) ?? ""
    const parentEmail    = (body.parentEmail as string | undefined) ?? ""
    const paymentType    = (body.paymentType as "once-off" | "monthly" | undefined) ?? "monthly"
    const childCount     = (body.childCount as number | undefined) ?? 1

    if (!orderReference || totalAmount == null || totalAmount <= 0) {
      return NextResponse.json({ error: "Missing required cart payment fields" }, { status: 400 })
    }
    if (!["once-off", "monthly"].includes(paymentType)) {
      return NextResponse.json({ error: "Invalid paymentType" }, { status: 400 })
    }

    try {
      const childLabel = childCount > 1 ? `${childCount} children` : "1 child"

      // p3 — description of goods, max 50 chars.
      const itemDescription = `${orderReference} Cart (${childLabel})`.slice(0, 50)

      // m10 — appended by Netcash as a querystring to the configured Accept/
      // Decline URL, so the success page can read ?ref=...&name=...
      const returnQueryParams = `ref=${encodeURIComponent(orderReference)}&name=${encodeURIComponent(parentName)}`

      const formFields = buildNetcashPayNowFields({
        serviceKey,
        orderReference,
        amount: totalAmount.toFixed(2),
        itemDescription,
        customerEmail: parentEmail,
        paymentType,
        returnQueryParams,
      })

      return NextResponse.json({ netcashUrl: NETCASH_PAY_NOW_URL, formFields })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error("[netcash-pay] Cart payment build error:", message)
      return NextResponse.json({ error: "Payment gateway error", detail: message }, { status: 500 })
    }
  }

  // ── Legacy single-enrollment path ────────────────────────────────────────
  const {
    referenceNumber,
    enrollmentId,
    parentName,
    parentEmail,
    packageName,
    packagePrice,
    paymentType,
  } = body as {
    referenceNumber?: string
    enrollmentId?: number
    parentName?: string
    parentEmail?: string
    packageName?: string
    packagePrice?: number
    paymentType?: "once-off" | "monthly"
  }

  if (
    !referenceNumber ||
    !enrollmentId ||
    !parentName ||
    !parentEmail ||
    !packageName ||
    packagePrice == null ||
    !paymentType
  ) {
    return NextResponse.json({ error: "Missing required payment fields" }, { status: 400 })
  }

  if (!["once-off", "monthly"].includes(paymentType!)) {
    return NextResponse.json({ error: "Invalid paymentType" }, { status: 400 })
  }

  if (packagePrice! <= 0) {
    return NextResponse.json({ error: "Invalid packagePrice" }, { status: 400 })
  }

  try {
    const { netcashUrl, formFields, orderId } = await buildNetcashPaymentForEnrollment({
      referenceNumber: referenceNumber!,
      enrollmentId: enrollmentId!,
      parentName: parentName!,
      parentEmail: parentEmail!,
      packageName: packageName!,
      packagePrice: packagePrice!,
      paymentType: paymentType!,
    })

    if (!netcashUrl || !formFields) {
      return NextResponse.json({ error: "Failed to build payment request" }, { status: 500 })
    }

    return NextResponse.json({ netcashUrl, formFields, orderId })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[netcash-pay] Error building payment:", message)
    return NextResponse.json({ error: "Payment gateway error", detail: message }, { status: 500 })
  }
}
