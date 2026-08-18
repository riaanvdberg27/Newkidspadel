"use server"

import { db } from "@/lib/db"
import { coaches } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { setCoachSession, clearCoachSession, verifyPassword } from "@/lib/coach-auth"

export async function coachLogin(_prev: { error?: string } | undefined, formData: FormData) {
  const username = String(formData.get("username") ?? "").trim()
  const password = String(formData.get("password") ?? "")

  if (!username || !password) {
    return { error: "Please enter your username and password." }
  }

  const [coach] = await db.select().from(coaches).where(eq(coaches.username, username)).limit(1)

  if (!coach || coach.accountStatus !== "active" || !verifyPassword(password, coach.passwordHash)) {
    return { error: "Invalid username or password." }
  }

  await setCoachSession(coach.id)
  redirect("/coach")
}

export async function coachLogout() {
  await clearCoachSession()
  redirect("/coach/login")
}
