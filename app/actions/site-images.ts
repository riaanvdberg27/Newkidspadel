"use server"

import { db } from "@/lib/db"
import { siteImages } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export type SiteImageRow = {
  id: number
  imageKey: string
  label: string
  description: string | null
  blobUrl: string | null
  updatedAt: string
}

export async function getAllSiteImages(): Promise<SiteImageRow[]> {
  const rows = await db.select().from(siteImages).orderBy(siteImages.id)
  return rows.map((r) => ({
    id: r.id,
    imageKey: r.imageKey,
    label: r.label,
    description: r.description,
    blobUrl: r.blobUrl,
    updatedAt: r.updatedAt.toISOString(),
  }))
}

export async function getSiteImageMap(): Promise<Record<string, string>> {
  const rows = await db.select().from(siteImages)
  const map: Record<string, string> = {}
  for (const r of rows) {
    if (r.blobUrl) map[r.imageKey] = r.blobUrl
  }
  return map
}

export async function updateSiteImage(imageKey: string, blobUrl: string): Promise<void> {
  await db
    .update(siteImages)
    .set({ blobUrl, updatedAt: new Date() })
    .where(eq(siteImages.imageKey, imageKey))

  revalidatePath("/")
  revalidatePath("/about")
}
