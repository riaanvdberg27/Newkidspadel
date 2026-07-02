"use server"

import { cookies, headers } from "next/headers"
import { db } from "@/lib/db"
import { impersonationLog, user } from "@/lib/db/schema"
import { requireAdmin } from "@/lib/admin-auth"
import { eq, or, ilike, desc } from "drizzle-orm"

// ---- Cookie name ----
export const IMPERSONATION_COOKIE = "ngp_impersonate"

// ---- Types ----
export type ImpersonationMode = "view-only" | "full"

export type ParentSearchResult = {
  id: string
  name: string
  email: string
  createdAt: Date
}

export type ActiveImpersonation = {
  parentId: string
  parentName: string
  parentEmail: string
  mode: ImpersonationMode
  logId: number
}

// ---- Search parents ----
export async function searchParents(query: string): Promise<ParentSearchResult[]> {
  await requireAdmin()
  if (!query || query.trim().length < 2) return []

  const q = `%${query.trim()}%`
  const rows = await db
    .select({ id: user.id, name: user.name, email: user.email, createdAt: user.createdAt })
    .from(user)
    .where(or(ilike(user.name, q), ilike(user.email, q)))
    .limit(20)

  return rows
}

// ---- Start impersonation ----
export async function startImpersonation(
  parentId: string,
  mode: ImpersonationMode,
  reason?: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin()

  const headerStore = await headers()
  const ip = headerStore.get("x-forwarded-for") ?? headerStore.get("x-real-ip") ?? "unknown"
  const ua = headerStore.get("user-agent") ?? "unknown"

  // Look up the parent
  const [parent] = await db.select().from(user).where(eq(user.id, parentId)).limit(1)
  if (!parent) return { ok: false, error: "Parent not found" }

  // Write audit log row
  const [log] = await db
    .insert(impersonationLog)
    .values({
      adminUser: "admin",
      parentId: parent.id,
      parentEmail: parent.email,
      reason: reason ?? null,
      mode,
      ipAddress: ip,
      userAgent: ua,
    })
    .returning()

  // Set the impersonation cookie (httpOnly, 2-hour max age)
  const payload = JSON.stringify({
    parentId: parent.id,
    parentName: parent.name,
    parentEmail: parent.email,
    mode,
    logId: log.id,
  })

  const cookieStore = await cookies()
  cookieStore.set(IMPERSONATION_COOKIE, Buffer.from(payload).toString("base64"), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 2, // 2 hours
  })

  return { ok: true }
}

// ---- End impersonation ----
export async function endImpersonation(): Promise<void> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(IMPERSONATION_COOKIE)?.value

  if (raw) {
    try {
      const parsed: ActiveImpersonation = JSON.parse(Buffer.from(raw, "base64").toString("utf-8"))
      // Mark the log row as ended
      await db
        .update(impersonationLog)
        .set({ endedAt: new Date() })
        .where(eq(impersonationLog.id, parsed.logId))
    } catch {
      // ignore parse errors
    }
  }

  cookieStore.delete(IMPERSONATION_COOKIE)
}

// ---- Read current impersonation (server-side only) ----
export async function getActiveImpersonation(): Promise<ActiveImpersonation | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(IMPERSONATION_COOKIE)?.value
  if (!raw) return null

  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64").toString("utf-8"))
    return parsed as ActiveImpersonation
  } catch {
    return null
  }
}

// ---- Admin: list recent impersonation logs ----
export async function getImpersonationLogs() {
  await requireAdmin()
  const rows = await db
    .select()
    .from(impersonationLog)
    .orderBy(desc(impersonationLog.startedAt))
    .limit(100)
  return rows
}
