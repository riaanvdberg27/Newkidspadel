/**
 * Netcash Pay Now ITN (Instant Transaction Notification) webhook.
 *
 * Netcash POSTs to this URL after every payment event.
 * We verify the hash, log the raw payload, then update orders / payments /
 * subscriptions / enrollments accordingly.
 *
 * Netcash expects a plain-text "OK" 200 response.
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import {
  enrollments,
  orders,
  payments,
  subscriptions,
  paymentEvents,
  webhookLogs,
} from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { verifyNetcashItn, type NetcashItnPayload } from "@/lib/netcash"
import { completeReferralForEnrollment } from "@/app/actions/referrals"
import { revalidatePath } from "next/cache"

function ok() {
  return new NextResponse("OK", { status: 200, headers: { "Content-Type": "text/plain" } })
}

function reject(reason: string) {
  console.log("[v0] Netcash ITN rejected:", reason)
  return new NextResponse("FAILED", { status: 200, headers: { "Content-Type": "text/plain" } })
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  // Capture raw headers for audit log
  const headerMap: Record<string, string> = {}
  req.headers.forEach((value, key) => { headerMap[key] = value })

  // Parse the URL-encoded body
  const params = new URLSearchParams(rawBody)
  const payload: NetcashItnPayload = {}
  params.forEach((value, key) => { payload[key] = value })

  const transactionStatus = payload.TransactionStatus ?? payload.p3 ?? ""
  const orderId = payload.OrderId ?? payload.p2 ?? ""
  const amount = payload.Amount ?? payload.p4 ?? ""
  const transactionId = payload.TransactionId ?? payload.p1 ?? ""
  const subscriptionToken = payload.SubscriptionToken ?? payload.token ?? ""

  // Log every incoming webhook regardless of outcome
  let logId: number | undefined
  try {
    const [logRow] = await db
      .insert(webhookLogs)
      .values({
        provider: "netcash",
        eventType: transactionStatus,
        rawBody,
        headers: headerMap,
        processed: false,
      })
      .returning({ id: webhookLogs.id })
    logId = logRow?.id
  } catch (err) {
    console.log("[v0] Netcash webhook — could not write log:", err)
  }

  // Verify the ITN hash
  const serviceKey = process.env.NETCASH_SERVICE_KEY ?? ""
  const valid = verifyNetcashItn(payload, serviceKey)
  if (!valid) {
    console.log("[v0] Netcash ITN — invalid hash, rejecting")
    if (logId) {
      await db.update(webhookLogs).set({ processingError: "Invalid hash" }).where(eq(webhookLogs.id, logId))
    }
    return reject("Invalid hash")
  }

  // Find the order by reference number (orderId = our referenceNumber)
  const orderRows = await db
    .select()
    .from(orders)
    .where(eq(orders.netcashOrderId, orderId))
    .limit(1)

  let order = orderRows[0]

  // Fallback: look up enrollment by referenceNumber
  let enrollmentRow: typeof enrollments.$inferSelect | undefined
  if (!order) {
    const enrollRows = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.referenceNumber, orderId))
      .limit(1)
    enrollmentRow = enrollRows[0]
  } else {
    const enrollRows = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.id, order.enrollmentId))
      .limit(1)
    enrollmentRow = enrollRows[0]
  }

  if (!enrollmentRow) {
    console.log("[v0] Netcash ITN — enrollment not found for orderId:", orderId)
    if (logId) {
      await db.update(webhookLogs).set({ processingError: `Enrollment not found: ${orderId}` }).where(eq(webhookLogs.id, logId))
    }
    return reject("Enrollment not found")
  }

  const isApproved = transactionStatus === "Approved" || transactionStatus === "1"
  const isDeclined = transactionStatus === "Declined" || transactionStatus === "2"
  const isCancelled = transactionStatus === "Cancelled" || transactionStatus === "0"

  const now = new Date()

  try {
    if (isApproved) {
      // Update the order status
      if (order) {
        await db
          .update(orders)
          .set({ status: "paid", netcashOrderId: orderId, paidAt: now, updatedAt: now })
          .where(eq(orders.id, order.id))
      }

      // Create a payment record
      const [paymentRow] = await db
        .insert(payments)
        .values({
          orderId: order?.id ?? 0,
          enrollmentId: enrollmentRow.id,
          userId: enrollmentRow.userId,
          amount: Math.round(parseFloat(amount || "0") * 100), // store cents
          provider: "netcash",
          status: "paid",
          netcashTransactionId: transactionId,
          netcashSubscriptionRef: subscriptionToken || null,
          paidAt: now,
        })
        .returning({ id: payments.id })

      // For monthly packages — upsert the subscription record
      if (enrollmentRow.paymentType === "monthly" && subscriptionToken) {
        const existingSubs = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.enrollmentId, enrollmentRow.id))
          .limit(1)

        if (existingSubs[0]) {
          await db
            .update(subscriptions)
            .set({
              status: "active",
              netcashSubscriptionRef: subscriptionToken,
              lastPaymentDate: now,
              nextBillingDate: nextMonthDate(now),
              updatedAt: now,
            })
            .where(eq(subscriptions.id, existingSubs[0].id))
        } else {
          await db.insert(subscriptions).values({
            enrollmentId: enrollmentRow.id,
            userId: enrollmentRow.userId,
            provider: "netcash",
            netcashSubscriptionRef: subscriptionToken,
            status: "active",
            billingFrequency: "monthly",
            amount: Math.round(parseFloat(amount || "0") * 100),
            lastPaymentDate: now,
            nextBillingDate: nextMonthDate(now),
          })
        }
      }

      // Activate the enrollment
      await db
        .update(enrollments)
        .set({
          paymentStatus: "paid",
          status: "active",
          onboardingComplete: true,
          payfastPaymentId: transactionId, // reuse existing column for transaction ID
          updatedAt: now,
        })
        .where(eq(enrollments.id, enrollmentRow.id))

      // Log the payment event
      await db.insert(paymentEvents).values({
        orderId: order?.id,
        paymentId: paymentRow?.id,
        enrollmentId: enrollmentRow.id,
        eventType: "payment_complete",
        payload: { transactionId, orderId, amount, subscriptionToken, status: transactionStatus },
      })

      // Complete any pending referral (best-effort)
      try { await completeReferralForEnrollment(enrollmentRow.id) } catch {}

    } else if (isDeclined) {
      if (order) {
        await db
          .update(orders)
          .set({ status: "failed", failureReason: "Declined by Netcash", updatedAt: now })
          .where(eq(orders.id, order.id))
      }

      await db
        .update(enrollments)
        .set({ paymentStatus: "failed", updatedAt: now })
        .where(eq(enrollments.id, enrollmentRow.id))

      await db.insert(paymentEvents).values({
        orderId: order?.id,
        enrollmentId: enrollmentRow.id,
        eventType: "payment_failed",
        payload: { transactionId, orderId, amount, status: transactionStatus },
      })

    } else if (isCancelled) {
      if (order) {
        await db
          .update(orders)
          .set({ status: "cancelled", updatedAt: now })
          .where(eq(orders.id, order.id))
      }

      await db.insert(paymentEvents).values({
        orderId: order?.id,
        enrollmentId: enrollmentRow.id,
        eventType: "payment_cancelled",
        payload: { transactionId, orderId, amount, status: transactionStatus },
      })
    }

    // Mark webhook log as processed
    if (logId) {
      await db.update(webhookLogs).set({ processed: true }).where(eq(webhookLogs.id, logId))
    }

    revalidatePath("/dashboard")
    revalidatePath("/admin")
  } catch (err) {
    console.log("[v0] Netcash ITN — processing error:", err)
    if (logId) {
      await db
        .update(webhookLogs)
        .set({ processingError: String(err) })
        .where(eq(webhookLogs.id, logId))
    }
    return reject("Processing error")
  }

  return ok()
}

function nextMonthDate(from: Date): Date {
  const d = new Date(from)
  d.setMonth(d.getMonth() + 1)
  return d
}
