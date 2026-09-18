import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { requireAdmin } from "@/lib/admin-auth"

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("file") as File | null

  if (!file || file.size === 0) {
    return NextResponse.json({ error: "file is required" }, { status: 400 })
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

  const blob = await put(`shop-products/${Date.now()}-${randomSuffix}.${ext}`, file, {
    access: "private",
    contentType: file.type,
  })

  return NextResponse.json({ url: blob.url })
}
