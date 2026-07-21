import "server-only"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { scryptSync, randomBytes, timingSafeEqual, createHmac } from "crypto"
import { db } from "@/lib/db"
import { coaches } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"

const COOKIE_NAME = "ngp_coach"

// Secret used to sign the session cookie. Falls back to a build-time constant
// if BETTER_AUTH_SECRET is not set (the token still can't be forged without it).
const SECRET = process.env.BETTER_AUTH_SECRET || "ngp-coach-portal-fallback-secret"

// ---- Password hashing (scrypt) ----

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex")
  const derived = scryptSync(password, salt, 64).toString("hex")
  return `${salt}:${derived}`
}

export function verifyPassword(password: string, stored: string | null): boolean {
  if (!stored || !stored.includes(":")) return false
  const [salt, key] = stored.split(":")
  const keyBuffer = Buffer.from(key, "hex")
  const derived = scryptSync(password, salt, 64)
  if (keyBuffer.length !== derived.length) return false
  return timingSafeEqual(keyBuffer, derived)
}

// ---- Session token (HMAC-signed coach id) ----

function sign(coachId: number): string {
  const payload = String(coachId)
  const sig = createHmac("sha256", SECRET).update(payload).digest("hex")
  return `${payload}.${sig}`
}

function verifyToken(token: string | undefined): number | null {
  if (!token || !token.includes(".")) return null
  const [payload, sig] = token.split(".")
  const expected = createHmac("sha256", SECRET).update(payload).digest("hex")
  const sigBuf = Buffer.from(sig, "hex")
  const expBuf = Buffer.from(expected, "hex")
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null
  const id = Number.parseInt(payload, 10)
  return Number.isFinite(id) ? id : null
}

// ---- Session management ----

export async function setCoachSession(coachId: number) {
  const store = await cookies()
  store.set(COOKIE_NAME, sign(coachId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12, // 12 hours
  })
}

export async function clearCoachSession() {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

/** Returns the authenticated coach id, or null. */
export async function getCoachId(): Promise<number | null> {
  const store = await cookies()
  return verifyToken(store.get(COOKIE_NAME)?.value)
}

/** Returns the full coach record for the current session, or null. */
export async function getCurrentCoach() {
  const id = await getCoachId()
  if (!id) return null
  const rows = await db.select().from(coaches).where(eq(coaches.id, id)).limit(1)
  const coach = rows[0]
  if (!coach || coach.accountStatus !== "active") return null
  return coach
}

/** Redirects to the coach login if not authenticated; returns the coach otherwise. */
export async function requireCoach() {
  const coach = await getCurrentCoach()
  if (!coach) {
    redirect("/coach/login")
  }
  return coach
}

/** Validate email + password, returning the coach id on success. */
export async function validateCoachCredentials(email: string, password: string): Promise<number | null> {
  const cleanEmail = email.trim().toLowerCase()
  if (!cleanEmail) return null
  const rows = await db
    .select()
    .from(coaches)
    .where(sql`lower(${coaches.email}) = ${cleanEmail}`)
    .limit(1)
  const coach = rows[0]
  if (!coach || coach.accountStatus !== "active") return null
  if (!verifyPassword(password, coach.passwordHash)) return null
  return coach.id
}
