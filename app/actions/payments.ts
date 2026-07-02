"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { orders, payments, subscriptions, paymentEvents } from "@/lib/db/schema"
import { and, desc, eq } from "drizzle-orm"
import { headers } from "next/headers"

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")
  return session.user.id
}

/** All payment records for the signed-in user. */
export async function getMyPayments() {
  const userId = await getUserId()
  return db
    .select()
    .from(payments)
    .where(eq(payments.userId, userId))
    .orderBy(desc(payments.createdAt))
}

/** All orders for the signed-in user. */
export async function getMyOrders() {
  const userId = await getUserId()
  return db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt))
}

/** Active subscription for a specific enrollment. */
export async function getSubscriptionForEnrollment(enrollmentId: number) {
  const userId = await getUserId()
  const rows = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.enrollmentId, enrollmentId),
        eq(subscriptions.userId, userId),
      ),
    )
    .orderBy(desc(subscriptions.createdAt))
    .limit(1)
  return rows[0] ?? null
}

/** All subscriptions for the signed-in user. */
export async function getMySubscriptions() {
  const userId = await getUserId()
  return db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt))
}

/** Payment history (payments) for a specific enrollment. */
export async function getPaymentsForEnrollment(enrollmentId: number) {
  const userId = await getUserId()
  return db
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.enrollmentId, enrollmentId),
        eq(payments.userId, userId),
      ),
    )
    .orderBy(desc(payments.createdAt))
}

// ---- Admin-only helpers (called from admin panel, check admin role separately) ----

export async function getAllPayments() {
  return db.select().from(payments).orderBy(desc(payments.createdAt))
}

export async function getAllOrders() {
  return db.select().from(orders).orderBy(desc(orders.createdAt))
}

export async function getAllSubscriptions() {
  return db.select().from(subscriptions).orderBy(desc(subscriptions.createdAt))
}

export async function getAllWebhookLogs() {
  const { webhookLogs } = await import("@/lib/db/schema")
  return db.select().from(webhookLogs).orderBy(desc(webhookLogs.createdAt)).limit(200)
}
