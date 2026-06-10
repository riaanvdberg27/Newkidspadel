"use server"

import { db } from "@/lib/db"
import { enrollments, notifications, requests, activityLogs, announcements } from "@/lib/db/schema"
import { getSession, isAdminEmail } from "@/lib/session"
import { desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

async function requireAdmin() {
  const session = await getSession()
  if (!session?.user || !isAdminEmail(session.user.email)) {
    throw new Error("Unauthorized")
  }
  return session.user
}

export async function getAllEnrollments() {
  await requireAdmin()
  return db.select().from(enrollments).orderBy(desc(enrollments.createdAt))
}

export async function getAllRequests() {
  await requireAdmin()
  return db.select().from(requests).orderBy(desc(requests.createdAt))
}

export async function getRecentActivity() {
  await requireAdmin()
  return db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(40)
}

export async function setEnrollmentStatus(id: number, status: string) {
  await requireAdmin()
  const [row] = await db
    .update(enrollments)
    .set({ status, updatedAt: new Date() })
    .where(eq(enrollments.id, id))
    .returning()

  if (row?.userId) {
    await db.insert(notifications).values({
      userId: row.userId,
      type: "enrollment_update",
      title: "Enrollment status updated",
      body: `Your enrollment for ${row.childName} is now marked "${status}".`,
    })
  }
  revalidatePath("/admin")
  return { ok: true as const }
}

export async function resolveRequest(id: number) {
  await requireAdmin()
  const [row] = await db
    .update(requests)
    .set({ status: "resolved" })
    .where(eq(requests.id, id))
    .returning()

  if (row) {
    await db.insert(notifications).values({
      userId: row.userId,
      type: "enrollment_update",
      title: "Request resolved",
      body: `Your request "${row.subject}" has been resolved.`,
    })
  }
  revalidatePath("/admin")
  return { ok: true as const }
}

export async function broadcastAnnouncement(formData: FormData) {
  await requireAdmin()
  const title = String(formData.get("title") ?? "").trim()
  const body = String(formData.get("body") ?? "").trim()
  if (!title || !body) return { ok: false as const, error: "Title and body are required." }

  await db.insert(announcements).values({ title, body })

  // Fan out to every activated parent's notification inbox.
  const parents = await db.select().from(enrollments).where(eq(enrollments.accountStatus, "active"))
  const seen = new Set<string>()
  for (const p of parents) {
    if (!p.userId || seen.has(p.userId)) continue
    seen.add(p.userId)
    await db.insert(notifications).values({
      userId: p.userId,
      type: "announcement",
      title,
      body,
    })
  }

  revalidatePath("/admin")
  return { ok: true as const, recipients: seen.size }
}
