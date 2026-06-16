import { type NextRequest, NextResponse } from "next/server"
import { head, list } from "@vercel/blob"

/**
 * Proxy private Vercel Blob files.
 * Usage: /api/blob?p=<pathname-or-full-url>
 *
 * Supports two formats stored in the DB:
 *   - Full URL  (new): "https://...blob.vercel-storage.com/coaches/abc.jpg"
 *     → pass directly to head() which accepts full URLs
 *   - Pathname  (old): "coaches/abc.jpg"
 *     → use list() to resolve the full URL first, then redirect
 *
 * Redirects to the pre-signed downloadUrl so the browser fetches the image
 * directly from Blob storage — no streaming through the server needed.
 */
export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams.get("p")

  if (!p) {
    return NextResponse.json({ error: "Missing pathname" }, { status: 400 })
  }

  try {
    // Case 1: full URL — pass straight to head()
    if (p.startsWith("https://") || p.startsWith("http://")) {
      const blob = await head(p)
      return NextResponse.redirect(blob.downloadUrl, { status: 302 })
    }

    // Case 2: bare pathname (legacy data) — find the blob via list()
    const { blobs } = await list({ prefix: p, limit: 1 })
    if (!blobs.length) {
      return new NextResponse("Not found", { status: 404 })
    }
    const blob = await head(blobs[0].url)
    return NextResponse.redirect(blob.downloadUrl, { status: 302 })
  } catch (error) {
    console.error("[blob proxy] error:", error)
    return new NextResponse("Not found", { status: 404 })
  }
}
