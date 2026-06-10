"use server"

import { db } from "@/lib/db"
import {
  enrollments,
  notifications,
  requests,
  announcements,
  activityLogs,
} from "@/lib/db/schema"
import { getUserId, getSession } from "@/lib/session"
import { and, desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function getMyEnrollment() {
  const userId = await getUserId()
  const [row] = await db.select().from(enrollments).where(eq(enrollments.userId, userId))
  return row ?? null
}

export async function getDashboardData() {
  const session = await getSession()
  if (!session?.user) return null
  const userId = session.user.id

  const [enrollment] = await db.select().from(enrollments).where(eq(enrollments.userId, userId))
  const notes = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
  const anns = await db.select().from(announcements).orderBy(desc(announcements.createdAt)).limit(3)

  return {
    user: session.user,
    enrollment: enrollment ?? null,
    notifications: notes,
    announcements: anns,
  }
}

export async function getMyNotifications() {
  const userId = await getUserId()
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
}

export async function getUnreadCount() {
  const userId = await getUserId()
  const rows = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)))
  return rows.length
}

export async function markNotificationRead(id: number) {
  const userId = await getUserId()
  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
  revalidatePath("/portal/notifications")
  revalidatePath("/portal")
}

export async function markAllNotificationsRead() {
  const userId = await getUserId()
  await db.update(notifications).set({ read: true }).where(eq(notifications.userId, userId))
  revalidatePath("/portal/notifications")
  revalidatePath("/portal")
}

export async function getAnnouncements() {
  return db.select().from(announcements).orderBy(desc(announcements.createdAt))
}

export async function getMyRequests() {
  const userId = await getUserId()
  return db
    .select()
    .from(requests)
    .where(eq(requests.userId, userId))
    .orderBy(desc(requests.createdAt))
}

export async function updateContactDetails(formData: FormData) {
  const userId = await getUserId()
  const parentMobile = String(formData.get("parentMobile") ?? "").trim()
  const emergencyContactName = String(formData.get("emergencyContactName") ?? "").trim()
  const emergencyContactPhone = String(formData.get("emergencyContactPhone") ?? "").trim()

  if (!parentMobile) return { ok: false as const, error: "Mobile number is required." }

  await db
    .update(enrollments)
    .set({
      parentMobile,
      emergencyContactName: emergencyContactName || null,
      emergencyContactPhone: emergencyContactPhone || null,
      updatedAt: new Date(),
    })
    .where(eq(enrollments.userId, userId))

  await db.insert(activityLogs).values({
    userId,
    action: "profile_update",
    detail: "Updated contact details",
  })

  revalidatePath("/portal/profile")
  return { ok: true as const }
}

export async function updatePreferences(prefs: {
  prefEmail: boolean
  prefWhatsapp: boolean
  prefSessionReminders: boolean
  prefAnnouncements: boolean
  prefHolidayClinics: boolean
  prefEvents: boolean
}) {
  const userId = await getUserId()
  await db
    .update(enrollments)
    .set({ ...prefs, updatedAt: new Date() })
    .where(eq(enrollments.userId, userId))

  await db.insert(activityLogs).values({
    userId,
    action: "profile_update",
    detail: "Updated communication preferences",
  })

  revalidatePath("/portal/profile")
  return { ok: true as const }
}

export async function completeOnboarding(prefs: {
  prefEmail: boolean
  prefWhatsapp: boolean
  prefSessionReminders: boolean
  prefAnnouncements: boolean
  prefHolidayClinics: boolean
  prefEvents: boolean
}) {
  const userId = await getUserId()
  await db
    .update(enrollments)
    .set({ ...prefs, onboardingComplete: true, updatedAt: new Date() })
    .where(eq(enrollments.userId, userId))
  revalidatePath("/portal")
  return { ok: true as const }
}

export async function submitRequest(formData: FormData) {
  const userId = await getUserId()
  const [enrollment] = await db.select().from(enrollments).where(eq(enrollments.userId, userId))
  if (!enrollment) return { ok: false as const, error: "No enrollment found." }

  const type = String(formData.get("type") ?? "general_enquiry")
  const subject = String(formData.get("subject") ?? "").trim()
  const message = String(formData.get("message") ?? "").trim()

  if (!subject || !message) return { ok: false as const, error: "Please add a subject and message." }

  await db.insert(requests).values({
    userId,
    enrollmentId: enrollment.id,
    type,
    subject,
    message,
  })

  await db.insert(notifications).values({
    userId,
    type: "enrollment_update",
    title: "Request received",
    body: `We've received your request: "${subject}". Our team will be in touch shortly.`,
  })

  await db.insert(activityLogs).values({
    userId,
    action: "request_submitted",
    detail: `${type}: ${subject}`,
  })

  revalidatePath("/portal/requests")
  return { ok: true as const }
}

export async function logActivity(action: string, detail?: string) {
  const session = await getSession()
  if (!session?.user) return
  await db.insert(activityLogs).values({ userId: session.user.id, action, detail: detail ?? null })
}
