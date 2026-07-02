import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { isAdminAuthenticated } from "@/lib/admin-auth"

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("file") as File | null

  if (!file || file.size === 0) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  const allowedImages = ["image/jpeg", "image/png", "image/webp", "image/gif"]
  const allowedVideos = ["video/mp4", "video/quicktime", "video/webm", "video/mov"]
  const allowed = [...allowedImages, ...allowedVideos]

  if (!allowed.includes(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, WebP, GIF images and MP4, MOV, WebM videos are supported" },
      { status: 400 }
    )
  }

  const isVideo = allowedVideos.includes(file.type)

  // 4 MB for images, 100 MB for videos
  const maxSize = isVideo ? 100 * 1024 * 1024 : 4 * 1024 * 1024
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: isVideo ? "Video must be under 100 MB" : "Image must be under 4 MB" },
      { status: 400 }
    )
  }

  const ext = file.name.split(".").pop() ?? (isVideo ? "mp4" : "jpg")
  const randomSuffix = Math.random().toString(36).slice(2, 7)
  const folder = isVideo ? "moments/videos" : "moments/images"
  const filename = `${folder}/${Date.now()}-${randomSuffix}.${ext}`

  const blob = await put(filename, file, {
    access: "private",
    contentType: file.type,
  })

  return NextResponse.json({ url: blob.url, mediaType: isVideo ? "video" : "image" })
}
