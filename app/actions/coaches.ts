"use server"

import { db } from "@/lib/db"
import { coaches } from "@/lib/db/schema"
import { eq, asc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { del } from "@vercel/blob"

export type CoachRow = {
  id: number
  name: string
  role: string
  bio: string
  imageUrl: string | null
  sortOrder: number
  published: boolean
}

export async function getCoaches(): Promise<CoachRow[]> {
  const rows = await db
    .select()
    .from(coaches)
    .orderBy(asc(coaches.sortOrder), asc(coaches.id))
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    role: r.role,
    bio: r.bio,
    imageUrl: r.imageUrl ?? null,
    sortOrder: r.sortOrder,
    published: r.published,
  }))
}

export async function getPublishedCoaches(): Promise<CoachRow[]> {
  const rows = await db
    .select()
    .from(coaches)
    .where(eq(coaches.published, true))
    .orderBy(asc(coaches.sortOrder), asc(coaches.id))
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    role: r.role,
    bio: r.bio,
    imageUrl: r.imageUrl ?? null,
    sortOrder: r.sortOrder,
    published: r.published,
  }))
}

export async function saveCoach(input: {
  id?: number
  name: string
  role: string
  bio: string
  imageUrl: string | null
  sortOrder: number
  published: boolean
}): Promise<{ ok: boolean; id: number }> {
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
    revalidatePath("/about")
    revalidatePath("/")
    return { ok: true, id: input.id }
  }
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
  revalidatePath("/about")
  revalidatePath("/")
  return { ok: true, id: row.id }
}

export async function deleteCoach(id: number, imageUrl: string | null): Promise<{ ok: boolean }> {
  // Delete the blob image if stored in Vercel Blob
  if (imageUrl && imageUrl.includes("vercel-storage.com")) {
    try {
      await del(imageUrl)
    } catch {
      // Non-fatal — carry on even if blob deletion fails
    }
  }
  await db.delete(coaches).where(eq(coaches.id, id))
  revalidatePath("/about")
  revalidatePath("/")
  return { ok: true }
}
