"use server"

import { desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { enrollments } from "@/lib/db/schema"
import { requireAdmin } from "@/lib/admin-auth"
import { generateContractPdf } from "@/lib/contract-pdf"
import { sendWelcomeEmail } from "@/lib/email"
import { formatSlot } from "@/lib/slots"
import { put } from "@vercel/blob"

export type AdminSignup = {
  id: number
  referenceNumber: string
  parentName: string
  parentEmail: string
  parentMobile: string
  childName: string
  childAge: number | null
  packageName: string
  club: string | null
  slotLabel: string | null
  agreedTerms: boolean
  consentMedia: boolean
  contractUrl: string | null
  signedAt: string | null
  createdAt: string | null
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
    childAge: r.childAge ?? null,
    packageName: r.packageName,
    club: r.club ?? null,
    slotLabel: r.slotWeekday != null && r.slotHour != null ? formatSlot(r.slotWeekday, r.slotHour) : null,
    agreedTerms: r.agreedTerms,
    consentMedia: r.consentMedia,
    contractUrl: r.contractUrl ?? null,
    signedAt: r.signedAt ? r.signedAt.toISOString() : null,
    createdAt: r.createdAt ? r.createdAt.toISOString() : null,
  }))
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

/** Regenerate the contract PDF for a signup and store it in Blob; returns the URL. */
export async function regenerateContract(id: number): Promise<{ url: string }> {
  await requireAdmin()
  const r = await loadEnrollment(id)
  const slotLabel =
    r.slotWeekday != null && r.slotHour != null ? formatSlot(r.slotWeekday, r.slotHour) : "To be confirmed"

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
    access: "public",
    contentType: "application/pdf",
    addRandomSuffix: true,
  })
  await db.update(enrollments).set({ contractUrl: blob.url }).where(eq(enrollments.id, id))
  return { url: blob.url }
}

/** Resend the welcome email (with the contract) for an existing signup. */
export async function resendWelcome(id: number): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin()
  const r = await loadEnrollment(id)
  const slotLabel =
    r.slotWeekday != null && r.slotHour != null ? formatSlot(r.slotWeekday, r.slotHour) : "To be confirmed"

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
    console.log("[v0] resendWelcome PDF failed:", err)
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
