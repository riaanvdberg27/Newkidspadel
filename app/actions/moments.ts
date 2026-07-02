"use server"

import { db } from "@/lib/db"
import { moments } from "@/lib/db/schema"
import { eq, asc, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { isAdminAuthenticated } from "@/lib/admin-auth"

export type MomentInput = {
  title: string
  caption?: string
  mediaUrl: string
  mediaType: "image" | "video"
  thumbnailUrl?: string
  category: string
  published: boolean
  sortOrder: number
}

export type PublicMoment = {
  id: number
  title: string
  caption: string | null
  mediaUrl: string
  mediaType: string
  thumbnailUrl: string | null
  category: string
  published: boolean
  sortOrder: number
  createdAt: Date
}

// ---- Public ----

export async function getPublishedMoments(): Promise<PublicMoment[]> {
  const rows = await db
    .select()
    .from(moments)
    .where(eq(moments.published, true))
    .orderBy(asc(moments.sortOrder), desc(moments.createdAt))
  return rows
}

// ---- Admin ----

export async function getAllMoments(): Promise<PublicMoment[]> {
  if (!(await isAdminAuthenticated())) throw new Error("Unauthorized")
  const rows = await db
    .select()
    .from(moments)
    .orderBy(asc(moments.sortOrder), desc(moments.createdAt))
  return rows
}

export async function createMoment(input: MomentInput): Promise<{ ok: boolean; error?: string }> {
  if (!(await isAdminAuthenticated())) return { ok: false, error: "Unauthorized" }
  try {
    await db.insert(moments).values({
      title: input.title,
      caption: input.caption ?? null,
      mediaUrl: input.mediaUrl,
      mediaType: input.mediaType,
      thumbnailUrl: input.thumbnailUrl ?? null,
      category: input.category,
      published: input.published,
      sortOrder: input.sortOrder,
    })
    revalidatePath("/moments")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}

export async function createMoments(inputs: MomentInput[]): Promise<{ ok: boolean; error?: string }> {
  if (!(await isAdminAuthenticated())) return { ok: false, error: "Unauthorized" }
  if (!inputs.length) return { ok: false, error: "No moments provided" }
  try {
    await db.insert(moments).values(
      inputs.map((input) => ({
        title: input.title,
        caption: input.caption ?? null,
        mediaUrl: input.mediaUrl,
        mediaType: input.mediaType,
        thumbnailUrl: input.thumbnailUrl ?? null,
        category: input.category,
        published: input.published,
        sortOrder: input.sortOrder,
      })),
    )
    revalidatePath("/moments")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}

export async function updateMoment(id: number, input: MomentInput): Promise<{ ok: boolean; error?: string }> {
  if (!(await isAdminAuthenticated())) return { ok: false, error: "Unauthorized" }
  try {
    await db
      .update(moments)
      .set({
        title: input.title,
        caption: input.caption ?? null,
        mediaUrl: input.mediaUrl,
        mediaType: input.mediaType,
        thumbnailUrl: input.thumbnailUrl ?? null,
        category: input.category,
        published: input.published,
        sortOrder: input.sortOrder,
      })
      .where(eq(moments.id, id))
    revalidatePath("/moments")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}

export async function deleteMoment(id: number): Promise<{ ok: boolean; error?: string }> {
  if (!(await isAdminAuthenticated())) return { ok: false, error: "Unauthorized" }
  try {
    await db.delete(moments).where(eq(moments.id, id))
    revalidatePath("/moments")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}
