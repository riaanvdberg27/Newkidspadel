"use server"

import { db } from "@/lib/db"
import { activationTokens, enrollments, notifications, activityLogs } from "@/lib/db/schema"
import { auth } from "@/lib/auth"
import { eq } from "drizzle-orm"

export type ActivationInfo =
  | { ok: true; email: string; parentName: string; childName: string; alreadyUsed: boolean }
  | { ok: false; error: string }

export async function getActivationInfo(token: string): Promise<ActivationInfo> {
  const [tok] = await db.select().from(activationTokens).where(eq(activationTokens.token, token))
  if (!tok) return { ok: false, error: "This activation link is invalid." }
  if (tok.expiresAt < new Date()) return { ok: false, error: "This activation link has expired." }

  const [enrollment] = await db.select().from(enrollments).where(eq(enrollments.id, tok.enrollmentId))
  if (!enrollment) return { ok: false, error: "Enrollment not found." }

  return {
    ok: true,
    email: tok.email,
    parentName: enrollment.parentName,
    childName: enrollment.childName,
    alreadyUsed: !!tok.usedAt,
  }
}

export async function activateAccount(
  token: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!password || password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." }
  }

  const [tok] = await db.select().from(activationTokens).where(eq(activationTokens.token, token))
  if (!tok) return { ok: false, error: "This activation link is invalid." }
  if (tok.expiresAt < new Date()) return { ok: false, error: "This activation link has expired." }
  if (tok.usedAt) return { ok: false, error: "This account has already been activated. Please sign in." }

  const [enrollment] = await db.select().from(enrollments).where(eq(enrollments.id, tok.enrollmentId))
  if (!enrollment) return { ok: false, error: "Enrollment not found." }

  // Create the Better Auth user with email + password.
  try {
    await auth.api.signUpEmail({
      body: { email: tok.email, password, name: enrollment.parentName },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not create account."
    if (msg.toLowerCase().includes("exist")) {
      return { ok: false, error: "An account already exists for this email. Please sign in." }
    }
    return { ok: false, error: msg }
  }

  // Look up the new user id and link the enrollment.
  const session = await auth.api.signInEmail({ body: { email: tok.email, password } }).catch(() => null)
  const userId = session?.user?.id

  if (userId) {
    await db
      .update(enrollments)
      .set({ userId, accountStatus: "active", status: "active", updatedAt: new Date() })
      .where(eq(enrollments.id, enrollment.id))

    await db.insert(notifications).values({
      userId,
      type: "enrollment_update",
      title: "Welcome to your Parent Portal",
      body: `Your account is active. ${enrollment.childName} is all set for ${enrollment.packageName}.`,
    })

    await db.insert(activityLogs).values({
      userId,
      action: "activation",
      detail: `Activated portal for ${enrollment.childName}`,
    })
  }

  await db.update(activationTokens).set({ usedAt: new Date() }).where(eq(activationTokens.id, tok.id))

  return { ok: true }
}
