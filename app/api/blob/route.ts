import { type NextRequest, NextResponse } from "next/server"
import { list } from "@vercel/blob"

/**
 * Proxy private Vercel Blob images through the server.
 * Usage: /api/blob?p=<pathname>  (e.g. coaches/abc.jpg)
 *
 * Private blobs live on *.private.blob.vercel-storage.com and require an
 * Authorization header — browsers cannot fetch them directly. This route
 * resolves the pathname to a full URL via list(), then fetches the blob
 * server-side with the token and streams the bytes back to the browser.
 */
export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams.get("p")
  if (!p) return NextResponse.json({ error: "Missing pathname" }, { status: 400 })

  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) return new NextResponse("Blob token not configured", { status: 500 })

  try {
    // Resolve pathname → full private URL via list()
    let blobUrl: string
    if (p.startsWith("https://") || p.startsWith("http://")) {
      blobUrl = p
    } else {
      const { blobs } = await list({ prefix: p, limit: 1 })
      if (!blobs.length) return new NextResponse("Not found", { status: 404 })
      blobUrl = blobs[0].url
    }

    // Fetch the private blob with the token — required for private stores
    const upstream = await fetch(blobUrl, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!upstream.ok) {
      return new NextResponse("Blob fetch failed", { status: upstream.status })
    }

    const contentType = upstream.headers.get("content-type") ?? "application/octet-stream"
    const contentLength = upstream.headers.get("content-length")
    const isVideo = contentType.startsWith("video/")

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      // Videos: no long caching — they can be large and change
      "Cache-Control": isVideo
        ? "public, max-age=3600"
        : "public, max-age=86400, stale-while-revalidate=604800",
    }
    if (contentLength) headers["Content-Length"] = contentLength

    return new NextResponse(upstream.body, { headers })
  } catch (error) {
    console.error("[blob proxy] error:", error)
    return new NextResponse("Not found", { status: 404 })
  }
}
