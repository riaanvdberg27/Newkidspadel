"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { enrollments } from "@/lib/db/schema"
import { and, desc, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")
  return session.user.id
}

function generateReference() {
  const year = new Date().getFullYear()
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase()
  return `NGP-${year}-${rand}`
}

export type EnrollmentInput = {
  parentName: string
  parentEmail: string
  parentMobile: string
  childName: string
  childDob: string
  childAge: number
  packageName: string
  club: string
  clubId: number | null
  slotWeekday: number | null
  slotHour: number | null
  debitAccountHolder: string
  debitBankName: string
  debitAccountNumber: string
  debitAccountType: string
  debitDay: number | null
  emergencyContactName: string
  emergencyContactPhone: string
  prefEmail: boolean
  prefWhatsapp: boolean
  prefSessionReminders: boolean
  prefAnnouncements: boolean
  prefEvents: boolean
  prefHolidayClinics: boolean
}

export async function createEnrollment(input: EnrollmentInput) {
  const userId = await getUserId()
  const referenceNumber = generateReference()

  await db.insert(enrollments).values({
    userId,
    referenceNumber,
    parentName: input.parentName,
    parentEmail: input.parentEmail,
    parentMobile: input.parentMobile,
    childName: input.childName,
    childDob: input.childDob,
    childAge: input.childAge,
    packageName: input.packageName,
    club: input.club,
    clubId: input.clubId ?? undefined,
    slotWeekday: input.slotWeekday ?? undefined,
    slotHour: input.slotHour ?? undefined,
    debitAccountHolder: input.debitAccountHolder,
    debitBankName: input.debitBankName,
    debitAccountNumber: input.debitAccountNumber,
    debitAccountType: input.debitAccountType,
    debitDay: input.debitDay ?? undefined,
    emergencyContactName: input.emergencyContactName,
    emergencyContactPhone: input.emergencyContactPhone,
    prefEmail: input.prefEmail,
    prefWhatsapp: input.prefWhatsapp,
    prefSessionReminders: input.prefSessionReminders,
    prefAnnouncements: input.prefAnnouncements,
    prefEvents: input.prefEvents,
    prefHolidayClinics: input.prefHolidayClinics,
    status: "active",
    accountStatus: "active",
    onboardingComplete: true,
  })

  revalidatePath("/dashboard")
  return { referenceNumber }
}

/** Parent changes the booked slot for one of their own enrollments. */
export async function updateEnrollmentSlot(input: {
  enrollmentId: number
  slotWeekday: number
  slotHour: number
}) {
  const userId = await getUserId()

  // Fetch the enrollment (scoped to the signed-in user)
  const rows = await db
    .select()
    .from(enrollments)
    .where(and(eq(enrollments.id, input.enrollmentId), eq(enrollments.userId, userId)))
    .limit(1)
  const current = rows[0]
  if (!current) throw new Error("Enrollment not found")
  if (current.clubId == null) throw new Error("This enrollment has no club assigned")

  await db
    .update(enrollments)
    .set({ slotWeekday: input.slotWeekday, slotHour: input.slotHour, updatedAt: new Date() })
    .where(and(eq(enrollments.id, input.enrollmentId), eq(enrollments.userId, userId)))

  revalidatePath("/dashboard")
  return { success: true }
}

export async function getMyEnrollments() {
  const userId = await getUserId()
  return db
    .select()
    .from(enrollments)
    .where(eq(enrollments.userId, userId))
    .orderBy(desc(enrollments.createdAt))
}

export async function getMyEnrollment(id: number) {
  const userId = await getUserId()
  const rows = await db
    .select()
    .from(enrollments)
    .where(and(eq(enrollments.id, id), eq(enrollments.userId, userId)))
    .limit(1)
  return rows[0] ?? null
}
