"use server"

import { db } from "@/lib/db"
import { siteSettings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/admin-auth"

export type ContactPerson = {
  id: string
  name: string
  role: string
  phone: string
  email: string
  showOn: "both" | "footer" | "contact"
}

/** Legacy key — kept so old rows are never orphaned */
const LEGACY_KEY = "contacts_v2"

const DEFAULTS: ContactPerson[] = [
  {
    id: "coach1",
    name: "Riaan van den Berg",
    role: "Co-Founder & Assistant Coach",
    phone: "084 412 2084",
    email: "riaan@nextgenpadel.co.za",
    showOn: "both",
  },
  {
    id: "coach2",
    name: "Gareth Nunes",
    role: "Co-Founder & Head Coach",
    phone: "066 352 7053",
    email: "gareth@nextgenpadel.co.za",
    showOn: "both",
  },
]

export async function getContacts(): Promise<ContactPerson[]> {
  const rows = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.key, LEGACY_KEY))
    .limit(1)

  if (rows.length === 0 || !rows[0].value) return DEFAULTS

  try {
    const parsed = JSON.parse(rows[0].value)
    if (Array.isArray(parsed) && parsed.length > 0) return parsed
  } catch {
    // fall through to defaults
  }
  return DEFAULTS
}

export async function updateContacts(
  contacts: ContactPerson[],
): Promise<{ ok: boolean }> {
  await requireAdmin()

  const value = JSON.stringify(contacts)
  const existing = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.key, LEGACY_KEY))
    .limit(1)

  if (existing.length > 0) {
    await db
      .update(siteSettings)
      .set({ value, updatedAt: new Date() })
      .where(eq(siteSettings.key, LEGACY_KEY))
  } else {
    await db.insert(siteSettings).values({ key: LEGACY_KEY, value })
  }

  revalidatePath("/")
  revalidatePath("/contact")
  revalidatePath("/admin")
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Legacy shim — keep old callers compiling (footer & contact page used this)
// ---------------------------------------------------------------------------
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

/** @deprecated Use getContacts() instead */
export async function getContactSettings(): Promise<ContactSettings> {
  const contacts = await getContacts()
  const c1 = contacts[0] ?? DEFAULTS[0]
  const c2 = contacts[1] ?? DEFAULTS[1]
  return {
    coach1_name: c1.name,
    coach1_role: c1.role,
    coach1_phone: c1.phone,
    coach1_email: c1.email,
    coach2_name: c2.name,
    coach2_role: c2.role,
    coach2_phone: c2.phone,
    coach2_email: c2.email,
  }
}
