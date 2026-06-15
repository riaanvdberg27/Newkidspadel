/**
 * PayFast ITN (Instant Transaction Notification) webhook.
 *
 * PayFast POSTs to this URL after a payment is processed.
 * We verify the signature, confirm with PayFast's servers, and update
 * the enrollment payment status in the database.
 *
 * PayFast docs: https://developers.payfast.co.za/docs#notify
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { enrollments } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { verifyItnSignature } from "@/lib/payfast"

// PayFast requires a 200 text/plain response.
function ok() {
  return new NextResponse("OK", { status: 200, headers: { "Content-Type": "text/plain" } })
}

function reject(reason: string) {
  console.log("[v0] PayFast ITN rejected:", reason)
  return new NextResponse("FAILED", { status: 200, headers: { "Content-Type": "text/plain" } })
}

export async function POST(req: NextRequest) {
  // Parse URL-encoded body
  const text = await req.text()
  const params = Object.fromEntries(new URLSearchParams(text))

  const passphrase = process.env.PAYFAST_PASSPHRASE ?? ""
  const merchantId = process.env.PAYFAST_MERCHANT_ID ?? ""

  // 1. Verify signature
  if (!verifyItnSignature(params, passphrase)) {
    return reject("Invalid signature")
  }

  // 2. Verify merchant_id
  if (params.merchant_id !== merchantId) {
    return reject("Merchant ID mismatch")
  }

  // 3. Validate with PayFast servers (confirm the ITN is genuine)
  try {
    const validationUrl =
      process.env.NODE_ENV === "production"
        ? "https://www.payfast.co.za/eng/query/validate"
        : "https://sandbox.payfast.co.za/eng/query/validate"

    const validationResponse = await fetch(validationUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: text,
    })
    const validationText = await validationResponse.text()
    if (!validationText.includes("VALID")) {
      return reject("ITN validation failed: " + validationText)
    }
  } catch (err) {
    return reject("Could not reach PayFast validation server: " + String(err))
  }

  const { m_payment_id, pf_payment_id, payment_status } = params

  if (!m_payment_id) {
    return reject("Missing m_payment_id")
  }

  // 4. Update the enrollment
  const newPaymentStatus =
    payment_status === "COMPLETE" ? "complete"
    : payment_status === "FAILED" ? "failed"
    : payment_status === "CANCELLED" ? "cancelled"
    : "pending"

  const newStatus = payment_status === "COMPLETE" ? "active" : "pending"

  await db
    .update(enrollments)
    .set({
      paymentStatus: newPaymentStatus,
      payfastPaymentId: pf_payment_id ?? null,
      status: newStatus,
      onboardingComplete: payment_status === "COMPLETE",
      updatedAt: new Date(),
    })
    .where(eq(enrollments.referenceNumber, m_payment_id))

  return ok()
}
