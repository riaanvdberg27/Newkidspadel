import { type NextRequest, NextResponse } from "next/server"
import { list } from "@vercel/blob"

export const runtime = "nodejs"

/**
 * Proxy for private Vercel Blob media.
 *   /api/blob?p=<pathname|url>   → original bytes (browser-loadable)
 *
 * Private blobs live on *.private.blob.vercel-storage.com and require an
 * Authorization header — browsers cannot fetch them directly. This route
 * resolves the pathname to a full URL and streams the blob back with the token
 * added server-side.
 *
 * Image RESIZING is NOT done here. Instead the Next.js image optimizer
 * (/_next/image) fetches this endpoint as its source and produces resized
 * AVIF/WebP — see lib/blob.ts. This keeps the proxy dependency-free (no sharp)
 * and reliable in every runtime, while still serving tiny optimized images.
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
    const isVideo = contentType.startsWith("video/")
    const isImage = contentType.startsWith("image/")

    const cacheControl = isVideo
      ? "public, max-age=86400, stale-while-revalidate=604800"
      : "public, max-age=31536000, immutable"

    // Optional resize (used by the local/sandbox path, which has no Vercel image
    // optimizer). `sharp` is imported LAZILY and wrapped in try/catch: on
    // production it fetches originals without `w`, so this never runs there —
    // and even if sharp failed to load, we fall through to the original bytes.
    const widthParam = request.nextUrl.searchParams.get("w")
    const width = widthParam ? Number.parseInt(widthParam, 10) : 0
    if (isImage && !isVideo && width > 0 && contentType !== "image/svg+xml") {
      try {
        const q = Number.parseInt(request.nextUrl.searchParams.get("q") ?? "72", 10)
        const { default: sharp } = await import("sharp")
        const input = Buffer.from(await upstream.arrayBuffer())
        const output = await sharp(input)
          .rotate()
          .resize({ width, withoutEnlargement: true })
          .webp({ quality: Number.isFinite(q) ? q : 72 })
          .toBuffer()
        return new NextResponse(new Uint8Array(output), {
          headers: { "Content-Type": "image/webp", "Cache-Control": cacheControl },
        })
      } catch (resizeError) {
        // Fall back to streaming the original below.
        console.error("[blob proxy] resize failed, serving original:", resizeError)
        const original = await fetch(blobUrl, { headers: { Authorization: `Bearer ${token}` } })
        return new NextResponse(original.body, {
          headers: { "Content-Type": contentType, "Cache-Control": cacheControl },
        })
      }
    }

    // Default: stream the original bytes. Long, immutable cache — blob pathnames
    // are unique per upload.
    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Cache-Control": cacheControl,
    }
    const contentLength = upstream.headers.get("content-length")
    const etag = upstream.headers.get("etag")
    if (contentLength) headers["Content-Length"] = contentLength
    if (etag) headers["ETag"] = etag

    return new NextResponse(upstream.body, { headers })
  } catch (error) {
    console.error("[blob proxy] error:", error)
    return new NextResponse("Not found", { status: 404 })
  }
}
