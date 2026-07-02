import { NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import { siteImages } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  const imageKey = formData.get("imageKey") as string | null

  if (!file || !imageKey) {
    return NextResponse.json({ error: "file and imageKey are required" }, { status: 400 })
  }

  const MAX = 5 * 1024 * 1024 // 5 MB
  if (file.size > MAX) {
    return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 413 })
  }

  const ext = file.name.split(".").pop() ?? "jpg"
  const blob = await put(`site-images/${imageKey}-${Date.now()}.${ext}`, file, {
    access: "public",
    contentType: file.type,
  })

  await db
    .update(siteImages)
    .set({ blobUrl: blob.url, updatedAt: new Date() })
    .where(eq(siteImages.imageKey, imageKey))

  // Revalidate the public pages so the new image is served immediately
  revalidatePath("/")
  revalidatePath("/about")
  revalidatePath("/admin")

  return NextResponse.json({ url: blob.url })
}
