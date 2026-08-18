import "server-only"
import { cookies } from "next/headers"
import crypto from "crypto"

const COOKIE_NAME = "ngp_coach"
const SESSION_MAX_AGE = 60 * 60 * 12 // 12 hours

function signingSecret() {
  return process.env.BETTER_AUTH_SECRET ?? "ngp-coach-portal-fallback-secret"
}

function sign(coachId: number) {
  return crypto.createHmac("sha256", signingSecret()).update(String(coachId)).digest("hex")
}

/** Hash a plaintext password as "salt:hash" (hex), using scrypt. */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex")
  const hash = crypto.scryptSync(password, salt, 64).toString("hex")
  return `${salt}:${hash}`
}

/** Verify a plaintext password against a stored "salt:hash" value. */
export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  if (!stored) return false
  const [salt, hash] = stored.split(":")
  if (!salt || !hash) return false
  try {
    const hashBuf = Buffer.from(hash, "hex")
    const testBuf = crypto.scryptSync(password, salt, 64)
    if (hashBuf.length !== testBuf.length) return false
    return crypto.timingSafeEqual(hashBuf, testBuf)
  } catch {
    return false
  }
}

export async function setCoachSession(coachId: number) {
  const store = await cookies()
  store.set(COOKIE_NAME, `${coachId}.${sign(coachId)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  })
}

export async function clearCoachSession() {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

/** Returns the authenticated coach's id from the session cookie, or null. */
export async function getCoachId(): Promise<number | null> {
  const store = await cookies()
  const raw = store.get(COOKIE_NAME)?.value
  if (!raw) return null
  const [idStr, sig] = raw.split(".")
  if (!idStr || !sig) return null
  const id = Number(idStr)
  if (!Number.isInteger(id) || sig !== sign(id)) return null
  return id
}

export async function requireCoachId(): Promise<number> {
  const id = await getCoachId()
  if (id == null) throw new Error("Not authorized")
  return id
}
