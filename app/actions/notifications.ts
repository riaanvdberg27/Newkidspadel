"use server"

import { headers } from "next/headers"
import { and, desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { notifications } from "@/lib/db/schema"
import { auth } from "@/lib/auth"
import { getActiveImpersonation } from "@/app/actions/impersonation"
import { revalidatePath } from "next/cache"

/** Resolves the real signed-in user id, or the impersonated parent's id when an admin is viewing as them. */
async function resolveUserId(): Promise<string | null> {
  const impersonation = await getActiveImpersonation()
  if (impersonation) return impersonation.parentId
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user?.id ?? null
}

export async function getMyNotifications() {
  const userId = await resolveUserId()
  if (!userId) return []
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(50)
}

export async function markNotificationRead(id: number): Promise<{ ok: boolean }> {
  const userId = await resolveUserId()
  if (!userId) return { ok: false }
  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
  revalidatePath("/dashboard")
  return { ok: true }
}

export async function markAllNotificationsRead(): Promise<{ ok: boolean }> {
  const userId = await resolveUserId()
  if (!userId) return { ok: false }
  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)))
  revalidatePath("/dashboard")
  return { ok: true }
}

/**
 * Internal helper — call from admin server actions after a change parents should
 * hear about (e.g. a time slot change made on their behalf). Never throws;
 * a notification failure should never block the underlying admin update.
 */
export async function notifyUser(userId: string, title: string, message: string, enrollmentId?: number) {
  try {
    await db.insert(notifications).values({ userId, title, message, enrollmentId: enrollmentId ?? null })
  } catch (err) {
    console.log("[v0] notifyUser error:", err)
  }
}
