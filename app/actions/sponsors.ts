"use server"

import { db } from "@/lib/db"
import { sponsors, type Sponsor } from "@/lib/db/schema"
import { asc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/admin-auth"

export type SponsorInput = {
  name: string
  logoUrl: string // blob pathname
  websiteUrl: string | null
  published: boolean
  sortOrder: number
}

// ---------------------------------------------------------------------------
// Public reads
// ---------------------------------------------------------------------------

export async function getPublishedSponsors(): Promise<Sponsor[]> {
  return db.select().from(sponsors).where(eq(sponsors.published, true)).orderBy(asc(sponsors.sortOrder))
}

// ---------------------------------------------------------------------------
// Admin reads
// ---------------------------------------------------------------------------

export async function adminGetSponsors(): Promise<Sponsor[]> {
  await requireAdmin()
  return db.select().from(sponsors).orderBy(asc(sponsors.sortOrder))
}

// ---------------------------------------------------------------------------
// Admin CRUD
// ---------------------------------------------------------------------------

export async function createSponsor(input: SponsorInput) {
  await requireAdmin()
  if (!input.name.trim()) throw new Error("Sponsor name is required")
  if (!input.logoUrl.trim()) throw new Error("A sponsor logo is required")

  await db.insert(sponsors).values({
    name: input.name.trim(),
    logoUrl: input.logoUrl.trim(),
    websiteUrl: input.websiteUrl?.trim() || null,
    published: input.published,
    sortOrder: input.sortOrder,
  })

  revalidatePath("/admin")
  revalidatePath("/")
  return { ok: true }
}

export async function updateSponsor(id: number, input: SponsorInput) {
  await requireAdmin()
  if (!input.name.trim()) throw new Error("Sponsor name is required")
  if (!input.logoUrl.trim()) throw new Error("A sponsor logo is required")

  await db
    .update(sponsors)
    .set({
      name: input.name.trim(),
      logoUrl: input.logoUrl.trim(),
      websiteUrl: input.websiteUrl?.trim() || null,
      published: input.published,
      sortOrder: input.sortOrder,
      updatedAt: new Date(),
    })
    .where(eq(sponsors.id, id))

  revalidatePath("/admin")
  revalidatePath("/")
  return { ok: true }
}

export async function deleteSponsor(id: number) {
  await requireAdmin()
  await db.delete(sponsors).where(eq(sponsors.id, id))
  revalidatePath("/admin")
  revalidatePath("/")
  return { ok: true }
}

export async function toggleSponsorPublished(id: number, published: boolean) {
  await requireAdmin()
  await db.update(sponsors).set({ published, updatedAt: new Date() }).where(eq(sponsors.id, id))
  revalidatePath("/admin")
  revalidatePath("/")
  return { ok: true }
}
