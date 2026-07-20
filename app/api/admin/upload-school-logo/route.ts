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

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, WebP, GIF and SVG are supported" }, { status: 400 })
  }

  if (file.size > 4 * 1024 * 1024) {
    return NextResponse.json({ error: "Image must be under 4 MB" }, { status: 400 })
  }

  const ext = file.name.split(".").pop() ?? "png"
  const randomSuffix = Math.random().toString(36).slice(2, 7)
  const filename = `schools/${Date.now()}-${randomSuffix}.${ext}`

  const blob = await put(filename, file, {
    access: "private",
    contentType: file.type,
  })

  // Return the pathname (not the full URL) so the DB stores a portable key
  // that goes through the /api/blob proxy — consistent with club images.
  return NextResponse.json({ url: blob.url, pathname: blob.pathname })
}
