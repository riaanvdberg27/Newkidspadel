"use server"

import { db } from "@/lib/db"
import { coaches, coachClubs, clubs } from "@/lib/db/schema"
import { eq, asc, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { del, list, head } from "@vercel/blob"

export type CoachRow = {
  id: number
  name: string
  role: string
  bio: string
  imageUrl: string | null
  sortOrder: number
  published: boolean
  clubIds: number[]
}

/**
 * Resolve a stored imageUrl (may be a bare pathname like "coaches/abc.jpg"
 * or a full https:// URL) to a usable https:// URL for next/image.
 *
 * - Full URL → returned as-is (already usable)
 * - Bare pathname → find the blob via list() and return its downloadUrl
 *   (a short-lived pre-signed URL that works in all environments)
 * - null → null
 */
async function resolveImageUrl(imageUrl: string | null | undefined): Promise<string | null> {
  if (!imageUrl) return null
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) return imageUrl
  try {
    console.log("[v0] resolveImageUrl: listing blobs with prefix:", imageUrl)
    const { blobs } = await list({ prefix: imageUrl, limit: 1 })
    console.log("[v0] resolveImageUrl: blobs found:", blobs.length, blobs[0]?.url)
    if (!blobs.length) return null
    const blob = await head(blobs[0].url)
    console.log("[v0] resolveImageUrl: downloadUrl:", blob.downloadUrl)
    return blob.downloadUrl
  } catch (err) {
    console.error("[v0] resolveImageUrl error:", err)
    return null
  }
}

async function attachClubIds(rows: Omit<CoachRow, "clubIds">[]): Promise<CoachRow[]> {
  if (rows.length === 0) return []
  const ids = rows.map((r) => r.id)
  const assignments = await db
    .select({ coachId: coachClubs.coachId, clubId: coachClubs.clubId })
    .from(coachClubs)
    .where(inArray(coachClubs.coachId, ids))
  const map = new Map<number, number[]>()
  for (const a of assignments) {
    if (!map.has(a.coachId)) map.set(a.coachId, [])
    map.get(a.coachId)!.push(a.clubId)
  }
  return rows.map((r) => ({ ...r, clubIds: map.get(r.id) ?? [] }))
}

export async function getCoaches(): Promise<CoachRow[]> {
  const rows = await db
    .select()
    .from(coaches)
    .orderBy(asc(coaches.sortOrder), asc(coaches.id))
  const base = rows.map((r) => ({
    id: r.id,
    name: r.name,
    role: r.role,
    bio: r.bio,
    imageUrl: r.imageUrl ?? null,
    sortOrder: r.sortOrder,
    published: r.published,
  }))
  // Resolve image URLs in parallel
  const resolved = await Promise.all(
    base.map(async (r) => ({ ...r, imageUrl: await resolveImageUrl(r.imageUrl) }))
  )
  return attachClubIds(resolved)
}

export async function getPublishedCoaches(): Promise<CoachRow[]> {
  const rows = await db
    .select()
    .from(coaches)
    .where(eq(coaches.published, true))
    .orderBy(asc(coaches.sortOrder), asc(coaches.id))
  const base = rows.map((r) => ({
    id: r.id,
    name: r.name,
    role: r.role,
    bio: r.bio,
    imageUrl: r.imageUrl ?? null,
    sortOrder: r.sortOrder,
    published: r.published,
  }))
  // Resolve image URLs in parallel
  const resolved = await Promise.all(
    base.map(async (r) => ({ ...r, imageUrl: await resolveImageUrl(r.imageUrl) }))
  )
  return attachClubIds(resolved)
}

/** Return published coaches assigned to a specific club — used in the enrollment wizard. */
export async function getCoachesByClub(clubId: number): Promise<CoachRow[]> {
  const assignments = await db
    .select({ coachId: coachClubs.coachId })
    .from(coachClubs)
    .where(eq(coachClubs.clubId, clubId))
  if (assignments.length === 0) return []
  const coachIds = assignments.map((a) => a.coachId)
  const rows = await db
    .select()
    .from(coaches)
    .where(eq(coaches.published, true))
    .orderBy(asc(coaches.sortOrder), asc(coaches.id))
  const filtered = rows.filter((r) => coachIds.includes(r.id))
  const base = filtered.map((r) => ({
    id: r.id,
    name: r.name,
    role: r.role,
    bio: r.bio,
    imageUrl: r.imageUrl ?? null,
    sortOrder: r.sortOrder,
    published: r.published,
  }))
  // Resolve image URLs in parallel
  const resolved = await Promise.all(
    base.map(async (r) => ({ ...r, imageUrl: await resolveImageUrl(r.imageUrl) }))
  )
  return resolved.map((r) => ({ ...r, clubIds: [clubId] }))
}

export async function saveCoach(input: {
  id?: number
  name: string
  role: string
  bio: string
  imageUrl: string | null
  sortOrder: number
  published: boolean
  clubIds: number[]
}): Promise<{ ok: boolean; id: number }> {
  let coachId: number

  if (input.id) {
    await db
      .update(coaches)
      .set({
        name: input.name,
        role: input.role,
        bio: input.bio,
        imageUrl: input.imageUrl ?? undefined,
        sortOrder: input.sortOrder,
        published: input.published,
        updatedAt: new Date(),
      })
      .where(eq(coaches.id, input.id))
    coachId = input.id
  } else {
    const [row] = await db
      .insert(coaches)
      .values({
        name: input.name,
        role: input.role,
        bio: input.bio,
        imageUrl: input.imageUrl ?? undefined,
        sortOrder: input.sortOrder,
        published: input.published,
      })
      .returning({ id: coaches.id })
    coachId = row.id
  }

  // Sync club assignments: delete all existing then re-insert
  await db.delete(coachClubs).where(eq(coachClubs.coachId, coachId))
  if (input.clubIds.length > 0) {
    await db.insert(coachClubs).values(
      input.clubIds.map((clubId) => ({ coachId, clubId }))
    )
  }

  revalidatePath("/about")
  revalidatePath("/")
  revalidatePath("/enrollment")
  return { ok: true, id: coachId }
}

export async function deleteCoach(id: number, imageUrl: string | null): Promise<{ ok: boolean }> {
  // imageUrl may be a full https:// URL or a bare pathname
  if (imageUrl) {
    try {
      await del(imageUrl)
    } catch {
      // Non-fatal — blob may already be gone
    }
  }
  await db.delete(coaches).where(eq(coaches.id, id))
  revalidatePath("/about")
  revalidatePath("/")
  revalidatePath("/enrollment")
  return { ok: true }
}
