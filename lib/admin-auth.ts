import "server-only"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

// Hardcoded admin credentials (as requested, for now)
export const ADMIN_USERNAME = "admin"
export const ADMIN_PASSWORD = "RiaanGareth"

const COOKIE_NAME = "ngp_admin"
// A stable token derived from the credentials. Changing the password invalidates sessions.
const SESSION_TOKEN = Buffer.from(`${ADMIN_USERNAME}:${ADMIN_PASSWORD}:ngp`).toString("base64")

export async function isAdminAuthenticated() {
  const store = await cookies()
  return store.get(COOKIE_NAME)?.value === SESSION_TOKEN
}

export async function setAdminSession() {
  const store = await cookies()
  store.set(COOKIE_NAME, SESSION_TOKEN, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  })
}

export async function clearAdminSession() {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

export function credentialsValid(username: string, password: string) {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD
}

export async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login")
  }
}
