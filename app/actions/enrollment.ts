"use server"

import { db } from "@/lib/db"
import { enrollments, activationTokens, notifications, activityLogs } from "@/lib/db/schema"
import { calculateAge, generateReference, getPackageById, ACADEMY } from "@/lib/academy"
import { sendWelcomeEmail } from "@/lib/email"
import { sendWhatsAppConfirmation } from "@/lib/whatsapp"
import { randomBytes } from "crypto"
import { eq } from "drizzle-orm"

function baseUrl() {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return process.env.V0_RUNTIME_URL ?? "http://localhost:3000"
}

export type EnrollmentResult =
  | { ok: true; reference: string; activationUrl: string; emailSimulated?: boolean }
  | { ok: false; error: string }

export async function submitEnrollment(formData: FormData): Promise<EnrollmentResult> {
  const parentName = String(formData.get("parentName") ?? "").trim()
  const parentEmail = String(formData.get("parentEmail") ?? "").trim().toLowerCase()
  const parentMobile = String(formData.get("parentMobile") ?? "").trim()
  const emergencyContactName = String(formData.get("emergencyContactName") ?? "").trim()
  const emergencyContactPhone = String(formData.get("emergencyContactPhone") ?? "").trim()
  const childName = String(formData.get("childName") ?? "").trim()
  const childDob = String(formData.get("childDob") ?? "").trim()
  const club = String(formData.get("club") ?? "").trim()
  const packageId = String(formData.get("packageId") ?? "").trim()

  if (!parentName || !parentEmail || !parentMobile || !childName || !childDob || !club || !packageId) {
    return { ok: false, error: "Please complete all required fields." }
  }

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRe.test(parentEmail)) return { ok: false, error: "Please enter a valid email address." }

  const pkg = getPackageById(packageId)
  if (!pkg) return { ok: false, error: "Please select a valid programme." }

  const childAge = calculateAge(childDob)
  if (isNaN(childAge) || childAge < 3 || childAge > 18) {
    return { ok: false, error: "Player must be between 3 and 18 years old." }
  }

  const reference = generateReference()

  const [enrollment] = await db
    .insert(enrollments)
    .values({
      referenceNumber: reference,
      parentName,
      parentEmail,
      parentMobile,
      emergencyContactName: emergencyContactName || null,
      emergencyContactPhone: emergencyContactPhone || null,
      childName,
      childDob,
      childAge,
      club,
      packageName: pkg.name,
    })
    .returning()

  // Create activation token (7 day expiry)
  const token = randomBytes(24).toString("hex")
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  await db.insert(activationTokens).values({
    token,
    enrollmentId: enrollment.id,
    email: parentEmail,
    expiresAt,
  })

  const activationUrl = `${baseUrl()}/activate/${token}`

  await db.insert(activityLogs).values({
    userId: "system",
    action: "enrollment_submitted",
    detail: `${childName} enrolled in ${pkg.name}`,
    metadata: { reference, club, parentEmail },
  })

  // Trigger onboarding automation
  const emailResult = await sendWelcomeEmail({
    to: parentEmail,
    parentName,
    childName,
    packageName: pkg.name,
    club,
    reference,
    activationUrl,
  })

  await sendWhatsAppConfirmation({ to: parentMobile, parentName, childName, reference })

  return {
    ok: true,
    reference,
    activationUrl,
    emailSimulated: emailResult.simulated,
  }
}

export async function getEnrollmentByReference(reference: string) {
  const [row] = await db.select().from(enrollments).where(eq(enrollments.referenceNumber, reference))
  return row ?? null
}

export const SUPPORT = ACADEMY
