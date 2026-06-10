import { auth } from "./auth"
import { headers } from "next/headers"

// Admin emails — anyone signing in with these addresses gets admin access.
export const ADMIN_EMAILS = ["admin@nextgenpadel.test", "coach@nextgenpadel.test"]

export async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}

export async function getUserId() {
  const session = await getSession()
  if (!session?.user) throw new Error("Unauthorized")
  return session.user.id
}

export function isAdminEmail(email?: string | null) {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase())
}
