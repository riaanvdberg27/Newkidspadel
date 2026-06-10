"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { enrollments, user } from "@/lib/db/schema"
import { and, desc, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { put } from "@vercel/blob"
import { generateContractPdf } from "@/lib/contract-pdf"
import { sendWelcomeEmail } from "@/lib/email"
import { formatSlot } from "@/lib/slots"

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
  packagePrice: number
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
  agreedTerms: boolean
  consentMedia: boolean
  signatureData: string | null
  signedName: string
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
  const signedAt = new Date()

  const inserted = await db
    .insert(enrollments)
    .values({
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
      agreedTerms: input.agreedTerms,
      consentMedia: input.consentMedia,
      signatureData: input.signatureData ?? undefined,
      signedName: input.signedName,
      signedAt,
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
    .returning({ id: enrollments.id })

  const enrollmentId = inserted[0]?.id
  const slotLabel =
    input.slotWeekday != null && input.slotHour != null ? formatSlot(input.slotWeekday, input.slotHour) : "To be confirmed"

  // Generate the signed contract PDF and store it in Blob.
  let contractPdf: Uint8Array | null = null
  let contractUrl: string | null = null
  try {
    contractPdf = await generateContractPdf({
      referenceNumber,
      packageName: input.packageName,
      packagePrice: input.packagePrice,
      clubName: input.club,
      slotLabel,
      childName: input.childName,
      childAge: input.childAge,
      parentName: input.parentName,
      parentEmail: input.parentEmail,
      parentMobile: input.parentMobile,
      emergencyName: input.emergencyContactName,
      emergencyPhone: input.emergencyContactPhone,
      agreedTerms: input.agreedTerms,
      consentMedia: input.consentMedia,
      signedName: input.signedName,
      signedAt,
      signatureDataUrl: input.signatureData,
    })

    const blob = await put(`contracts/${referenceNumber}.pdf`, Buffer.from(contractPdf), {
      access: "private",
      contentType: "application/pdf",
      addRandomSuffix: true,
    })
    // Store the blob pathname (not a public URL). The contract is served to
    // admins through an authenticated route, since it contains banking details.
    contractUrl = blob.pathname

    if (enrollmentId != null) {
      await db.update(enrollments).set({ contractUrl }).where(eq(enrollments.id, enrollmentId))
    }
  } catch (err) {
    console.log("[v0] Contract PDF generation/upload failed:", err)
  }

  // Send the welcome email with the contract attached (best-effort).
  try {
    await sendWelcomeEmail({
      to: input.parentEmail,
      parentName: input.parentName,
      childName: input.childName,
      packageName: input.packageName,
      packagePrice: input.packagePrice,
      clubName: input.club,
      slotLabel,
      referenceNumber,
      contractPdf,
    })
  } catch (err) {
    console.log("[v0] Welcome email failed:", err)
  }

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

export async function updateProfile(input: { name: string; mobile: string }) {
  const userId = await getUserId()
  const name = input.name.trim()
  const mobile = input.mobile.trim()
  if (!name) throw new Error("Name is required.")
  // Update the user display name
  await db.update(user).set({ name, updatedAt: new Date() }).where(eq(user.id, userId))
  // Also update parentName and parentMobile on all the user's enrollments
  await db
    .update(enrollments)
    .set({ parentName: name, parentMobile: mobile })
    .where(eq(enrollments.userId, userId))
  revalidatePath("/dashboard")
  return { success: true }
}
