import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import { siteImages } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("file") as File | null
  const imageKey = formData.get("imageKey") as string | null

  if (!file || !imageKey || file.size === 0) {
    return NextResponse.json({ error: "file and imageKey are required" }, { status: 400 })
  }

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"]
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, WebP and GIF are supported" }, { status: 400 })
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Image must be under 5 MB" }, { status: 413 })
  }

  const ext = file.name.split(".").pop() ?? "jpg"
  const randomSuffix = Math.random().toString(36).slice(2, 7)

  // Use private access to match the rest of the blob store — served via /api/blob proxy
  const blob = await put(`site-images/${imageKey}-${Date.now()}-${randomSuffix}.${ext}`, file, {
    access: "private",
    contentType: file.type,
  })

  await db
    .update(siteImages)
    .set({ blobUrl: blob.url, updatedAt: new Date() })
    .where(eq(siteImages.imageKey, imageKey))

  // Revalidate public pages so they pick up the new image on next request
  revalidatePath("/")
  revalidatePath("/about")
  revalidatePath("/admin")

  return NextResponse.json({ url: blob.url })
}
