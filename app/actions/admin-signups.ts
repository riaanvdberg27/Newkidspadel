"use server"

import { desc, eq, ilike, or } from "drizzle-orm"
import { db } from "@/lib/db"
import { enrollments, user } from "@/lib/db/schema"
import { requireAdmin } from "@/lib/admin-auth"
import { generateContractPdf } from "@/lib/contract-pdf"
import { sendWelcomeEmail } from "@/lib/email"
import { formatSlot } from "@/lib/slots"
import { put } from "@vercel/blob"
import { revalidatePath } from "next/cache"
import { nanoid } from "nanoid"

export type AdminSignup = {
  id: number
  referenceNumber: string
  parentName: string
  parentEmail: string
  parentMobile: string
  childName: string
  childDob: string | null
  childAge: number | null
  packageName: string
  club: string | null
  coachName: string | null
  slotWeekday: number | null
  // numeric column returns string from Drizzle; parse with parseFloat before display
  slotHour: string | null
  slotLabel: string | null
  emergencyContactName: string | null
  emergencyContactPhone: string | null
  debitAccountHolder: string | null
  debitBankName: string | null
  debitAccountNumber: string | null
  debitAccountType: string | null
  debitDay: number | null
  agreedTerms: boolean
  consentMedia: boolean
  contractUrl: string | null
  status: string
  paymentType: string
  paymentStatus: string
  payfastPaymentId: string | null
  signedAt: string | null
  createdAt: string | null
}

export type UpdateSignupInput = {
  parentName: string
  parentEmail: string
  parentMobile: string
  childName: string
  childDob: string
  childAge: number
  packageName: string
  club: string
  coachName: string
  slotWeekday: number | null
  slotHour: number | null
  emergencyContactName: string
  emergencyContactPhone: string
  status: string
  paymentStatus?: string
}

export async function getAllSignups(): Promise<AdminSignup[]> {
  await requireAdmin()
  const rows = await db.select().from(enrollments).orderBy(desc(enrollments.createdAt))
  return rows.map((r) => ({
    id: r.id,
    referenceNumber: r.referenceNumber,
    parentName: r.parentName,
    parentEmail: r.parentEmail,
    parentMobile: r.parentMobile,
    childName: r.childName,
    childDob: r.childDob ?? null,
    childAge: r.childAge ?? null,
    packageName: r.packageName,
    club: r.club ?? null,
    coachName: r.coachName ?? null,
    slotWeekday: r.slotWeekday ?? null,
    slotHour: r.slotHour ?? null,
    slotLabel: r.slotWeekday != null && r.slotHour != null ? formatSlot(r.slotWeekday, parseFloat(String(r.slotHour))) : null,
    emergencyContactName: r.emergencyContactName ?? null,
    emergencyContactPhone: r.emergencyContactPhone ?? null,
    debitAccountHolder: r.debitAccountHolder ?? null,
    debitBankName: r.debitBankName ?? null,
    debitAccountNumber: r.debitAccountNumber ?? null,
    debitAccountType: r.debitAccountType ?? null,
    debitDay: r.debitDay ?? null,
    agreedTerms: r.agreedTerms,
    consentMedia: r.consentMedia,
    contractUrl: r.contractUrl ?? null,
    status: r.status,
    paymentType: r.paymentType ?? "monthly",
    paymentStatus: r.paymentStatus ?? "pending",
    payfastPaymentId: r.payfastPaymentId ?? null,
    signedAt: r.signedAt ? r.signedAt.toISOString() : null,
    createdAt: r.createdAt ? r.createdAt.toISOString() : null,
  }))
}

/** Admin updates contact / enrollment details for a sign-up. */
export async function updateSignup(
  id: number,
  input: UpdateSignupInput,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin()
  try {
    await db
      .update(enrollments)
      .set({
        parentName: input.parentName.trim(),
        parentEmail: input.parentEmail.trim(),
        parentMobile: input.parentMobile.trim(),
        childName: input.childName.trim(),
        childDob: input.childDob,
        childAge: input.childAge,
        packageName: input.packageName.trim(),
        club: input.club.trim(),
        coachName: input.coachName.trim() || null,
        slotWeekday: input.slotWeekday ?? undefined,
        slotHour: input.slotHour != null ? String(input.slotHour) : undefined,
        emergencyContactName: input.emergencyContactName.trim() || undefined,
        emergencyContactPhone: input.emergencyContactPhone.trim() || undefined,
        status: input.status,
        ...(input.paymentStatus !== undefined && { paymentStatus: input.paymentStatus }),
        updatedAt: new Date(),
      })
      .where(eq(enrollments.id, id))
    revalidatePath("/admin")
    return { ok: true }
  } catch (err) {
    console.log("[v0] updateSignup error:", err)
    return { ok: false, error: err instanceof Error ? err.message : "Update failed" }
  }
}

async function loadEnrollment(id: number) {
  const rows = await db.select().from(enrollments).where(eq(enrollments.id, id)).limit(1)
  const row = rows[0]
  if (!row) throw new Error("Signup not found")
  return row
}

function priceFor(packageName: string): number {
  if (/advanced/i.test(packageName)) return 900
  if (/beginner/i.test(packageName)) return 600
  return 0
}

/** Regenerate the contract PDF for a signup and store it in Blob; returns the blob pathname. */
export async function regenerateContract(id: number): Promise<{ pathname: string }> {
  await requireAdmin()
  const r = await loadEnrollment(id)
  const slotLabel =
    r.slotWeekday != null && r.slotHour != null ? formatSlot(r.slotWeekday, parseFloat(String(r.slotHour))) : "To be confirmed"

  const pdf = await generateContractPdf({
    referenceNumber: r.referenceNumber,
    packageName: r.packageName,
    packagePrice: priceFor(r.packageName),
    clubName: r.club ?? "",
    slotLabel,
    childName: r.childName,
    childAge: r.childAge ?? "",
    parentName: r.parentName,
    parentEmail: r.parentEmail,
    parentMobile: r.parentMobile,
    emergencyName: r.emergencyContactName,
    emergencyPhone: r.emergencyContactPhone,
    agreedTerms: r.agreedTerms,
    consentMedia: r.consentMedia,
    signedName: r.signedName,
    signedAt: r.signedAt,
    signatureDataUrl: r.signatureData,
  })

  const blob = await put(`contracts/${r.referenceNumber}.pdf`, Buffer.from(pdf), {
    access: "private",
    contentType: "application/pdf",
    addRandomSuffix: true,
  })
  // Persist the blob pathname; the file is served via an authenticated admin route.
  await db.update(enrollments).set({ contractUrl: blob.pathname }).where(eq(enrollments.id, id))
  return { pathname: blob.pathname }
}

/** Resend the welcome email (with the contract) for an existing signup. */
export async function resendWelcome(id: number): Promise<{ ok: boolean; error?: string }> {  await requireAdmin()
  const r = await loadEnrollment(id)
  const slotLabel =
    r.slotWeekday != null && r.slotHour != null ? formatSlot(r.slotWeekday, parseFloat(String(r.slotHour))) : "To be confirmed"

  let pdf: Uint8Array | null = null
  try {
    pdf = await generateContractPdf({
      referenceNumber: r.referenceNumber,
      packageName: r.packageName,
      packagePrice: priceFor(r.packageName),
      clubName: r.club ?? "",
      slotLabel,
      childName: r.childName,
      childAge: r.childAge ?? "",
      parentName: r.parentName,
      parentEmail: r.parentEmail,
      parentMobile: r.parentMobile,
      emergencyName: r.emergencyContactName,
      emergencyPhone: r.emergencyContactPhone,
      agreedTerms: r.agreedTerms,
      consentMedia: r.consentMedia,
      signedName: r.signedName,
      signedAt: r.signedAt,
      signatureDataUrl: r.signatureData,
    })
  } catch (err) {
    console.error("[email] resendWelcome PDF generation failed:", err)
  }

  return sendWelcomeEmail({
    to: r.parentEmail,
    parentName: r.parentName,
    childName: r.childName,
    packageName: r.packageName,
    packagePrice: priceFor(r.packageName),
    clubName: r.club ?? "",
    slotLabel,
    referenceNumber: r.referenceNumber,
    contractPdf: pdf,
  })
}

/** Permanently delete a sign-up record. */
export async function deleteSignup(id: number): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin()
  try {
    await db.delete(enrollments).where(eq(enrollments.id, id))
    revalidatePath("/admin")
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Delete failed" }
  }
}

export type UserSearchResult = {
  id: string
  name: string
  email: string
}

/**
 * Search registered user accounts by name or email.
 * Used in the admin Add Sign-up modal to link a new enrollment to an
 * existing parent account so they see all their children on login.
 */
export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  await requireAdmin()
  if (!query || query.trim().length < 2) return []
  const q = `%${query.trim()}%`
  const rows = await db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .where(or(ilike(user.name, q), ilike(user.email, q)))
    .limit(8)
  return rows
}

export type CreateSignupInput = {
  parentName: string
  parentEmail: string
  parentMobile: string
  childName: string
  childDob: string
  childAge: number
  packageName: string
  club: string
  coachName: string
  slotWeekday: number | null
  slotHour: number | null
  emergencyContactName: string
  emergencyContactPhone: string
  status: string
  /**
   * When set, the enrollment is linked to this user account so the parent
   * can see it on their dashboard. Leave undefined to create an unlinked record.
   */
  linkUserId?: string
}

/** Manually create a sign-up from the admin dashboard. */
export async function createSignup(input: CreateSignupInput): Promise<{ ok: boolean; id?: number; referenceNumber?: string; error?: string }> {
  await requireAdmin()
  try {
    const referenceNumber = `NGP-${nanoid(8).toUpperCase()}`
    // Use the linked user's ID so the parent sees this on their dashboard,
    // or fall back to "admin" for unlinked / new-account enrollments.
    const userId = input.linkUserId ?? "admin"
    const [row] = await db
      .insert(enrollments)
      .values({
        userId,
        referenceNumber,
        parentName: input.parentName.trim(),
        parentEmail: input.parentEmail.trim(),
        parentMobile: input.parentMobile.trim(),
        childName: input.childName.trim(),
        childDob: input.childDob,
        childAge: input.childAge,
        packageName: input.packageName.trim(),
        club: input.club.trim(),
        coachName: input.coachName.trim() || null,
        slotWeekday: input.slotWeekday ?? undefined,
        slotHour: input.slotHour != null ? String(input.slotHour) : undefined,
        emergencyContactName: input.emergencyContactName.trim() || undefined,
        emergencyContactPhone: input.emergencyContactPhone.trim() || undefined,
        status: input.status,
        agreedTerms: false,
        consentMedia: false,
      })
      .returning({ id: enrollments.id })
    revalidatePath("/admin")
    return { ok: true, id: row.id, referenceNumber }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Create failed" }
  }
}
