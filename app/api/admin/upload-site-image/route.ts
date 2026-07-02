// This route handles ONLY the blob upload — no auth check, no DB write.
// Auth + DB update + revalidation are done in the saveSiteImage() Server Action
// called by the client immediately after this route returns the blob URL.
// This matches the pattern used by upload-moment and upload-club-image.
import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get("file") as File | null
  const imageKey = formData.get("imageKey") as string | null

  if (!file || !imageKey || file.size === 0) {
    return NextResponse.json({ error: "file and imageKey are required" }, { status: 400 })
  }

  // The hero mascot image is hardcoded and must never be overwritten
  if (imageKey === "hero-kids") {
    return NextResponse.json({ error: "This image cannot be replaced." }, { status: 403 })
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

  const blob = await put(`site-images/${imageKey}-${Date.now()}-${randomSuffix}.${ext}`, file, {
    access: "private",
    contentType: file.type,
  })

  return NextResponse.json({ url: blob.url })
}
