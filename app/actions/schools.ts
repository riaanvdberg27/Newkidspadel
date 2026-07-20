"use server"

import { db } from "@/lib/db"
import { schools } from "@/lib/db/schema"
import { asc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/admin-auth"
import type { School } from "@/lib/db/schema"
import { put } from "@vercel/blob"

export type SchoolInput = {
  name: string
  location: string
  address: string
  phone: string
  email: string
  website: string
  description: string
  logoUrl?: string | null
  contactPerson: string
  published: boolean
}

/** Upload a school logo to Vercel Blob (admin only). Accepts FormData so the
 *  file bytes travel via the server action — no separate HTTP route needed,
 *  so cookies/auth work correctly in all environments. */
export async function uploadSchoolLogo(
  formData: FormData,
): Promise<{ url: string } | { error: string }> {
  await requireAdmin()

  const file = formData.get("file") as File | null
  if (!file || file.size === 0) return { error: "No file provided" }

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]
  if (!allowed.includes(file.type)) return { error: "Only JPEG, PNG, WebP, GIF and SVG are supported" }
  if (file.size > 4 * 1024 * 1024) return { error: "Image must be under 4 MB" }

  try {
    const ext = file.name.split(".").pop() ?? "png"
    const suffix = Math.random().toString(36).slice(2, 7)
    const filename = `schools/${Date.now()}-${suffix}.${ext}`
    const blob = await put(filename, file, { access: "public", contentType: file.type })
    return { url: blob.url }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[v0] uploadSchoolLogo failed:", message)
    return { error: `Upload failed: ${message}` }
  }
}

/** All published schools for the public site. */
export async function getPublishedSchools(): Promise<School[]> {
  return db.select().from(schools).where(eq(schools.published, true)).orderBy(asc(schools.name))
}

/** All schools for admin (published + unpublished). */
export async function getAllSchoolsAdmin(): Promise<School[]> {
  return db.select().from(schools).orderBy(asc(schools.name))
}

/** A single school by id. */
export async function getSchoolById(id: number): Promise<School | null> {
  const rows = await db.select().from(schools).where(eq(schools.id, id)).limit(1)
  return rows[0] ?? null
}

/** Create a new school (admin only). */
export async function createSchool(input: SchoolInput): Promise<School> {
  await requireAdmin()
  const [row] = await db
    .insert(schools)
    .values({
      name: input.name,
      location: input.location,
      address: input.address,
      phone: input.phone,
      email: input.email,
      website: input.website,
      description: input.description,
      logoUrl: input.logoUrl ?? null,
      contactPerson: input.contactPerson,
      published: input.published,
    })
    .returning()
  revalidatePath("/schools")
  revalidatePath("/admin")
  revalidatePath("/enrollment")
  return row
}

/** Update an existing school (admin only). */
export async function updateSchool(id: number, input: SchoolInput): Promise<School> {
  await requireAdmin()
  const [row] = await db
    .update(schools)
    .set({
      name: input.name,
      location: input.location,
      address: input.address,
      phone: input.phone,
      email: input.email,
      website: input.website,
      description: input.description,
      logoUrl: input.logoUrl ?? null,
      contactPerson: input.contactPerson,
      published: input.published,
      updatedAt: new Date(),
    })
    .where(eq(schools.id, id))
    .returning()
  revalidatePath("/schools")
  revalidatePath("/admin")
  revalidatePath("/enrollment")
  return row
}

/** Delete a school (admin only). */
export async function deleteSchool(id: number): Promise<void> {
  await requireAdmin()
  await db.delete(schools).where(eq(schools.id, id))
  revalidatePath("/schools")
  revalidatePath("/admin")
  revalidatePath("/enrollment")
}
