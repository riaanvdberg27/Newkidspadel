"use server"

import { db } from "@/lib/db"
import { siteSettings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/admin-auth"

const COACH_KEYS = [
  "coach1_name", "coach1_role", "coach1_phone", "coach1_email",
  "coach2_name", "coach2_role", "coach2_phone", "coach2_email",
] as const

export type ContactSettings = {
  coach1_name: string
  coach1_role: string
  coach1_phone: string
  coach1_email: string
  coach2_name: string
  coach2_role: string
  coach2_phone: string
  coach2_email: string
}

const DEFAULTS: ContactSettings = {
  coach1_name: "Riaan van den Berg",
  coach1_role: "Co-Founder & Assistant Coach",
  coach1_phone: "084 412 2084",
  coach1_email: "riaan@nextgenpadel.co.za",
  coach2_name: "Gareth Nunes",
  coach2_role: "Co-Founder & Head Coach",
  coach2_phone: "066 352 7053",
  coach2_email: "gareth@nextgenpadel.co.za",
}

export async function getContactSettings(): Promise<ContactSettings> {
  const rows = await db.select().from(siteSettings)
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]))
  const result = {} as ContactSettings
  for (const key of COACH_KEYS) {
    result[key] = map[key] ?? DEFAULTS[key]
  }
  return result
}

export async function updateContactSettings(
  input: ContactSettings,
): Promise<{ ok: boolean }> {
  await requireAdmin()
  for (const key of COACH_KEYS) {
    const value = input[key].trim()
    const existing = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, key))
      .limit(1)

    if (existing.length > 0) {
      await db
        .update(siteSettings)
        .set({ value, updatedAt: new Date() })
        .where(eq(siteSettings.key, key))
    } else {
      await db.insert(siteSettings).values({ key, value })
    }
  }
  revalidatePath("/")
  revalidatePath("/contact")
  revalidatePath("/admin")
  return { ok: true }
}
