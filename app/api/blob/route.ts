import { type NextRequest, NextResponse } from "next/server"
import { list } from "@vercel/blob"

export const runtime = "nodejs"

// NOTE: `sharp` is imported lazily inside the request handler (not at module
// scope). Its native binary can fail to load in some serverless runtimes, and
// a top-level import would crash the ENTIRE route module on load — making every
// request (even ones that don't resize) return a 500. A lazy import contains
// any failure to the resize path, where we gracefully fall back to the original.

/**
 * Proxy + optimizer for private Vercel Blob media.
 * Usage:
 *   /api/blob?p=<pathname|url>              → original bytes
 *   /api/blob?p=<pathname|url>&w=640        → resized WebP (width 640)
 *
 * Private blobs live on *.private.blob.vercel-storage.com and require an
 * Authorization header — browsers cannot fetch them directly. This route
 * resolves the pathname to a full URL, fetches the blob server-side with the
 * token, and (for images) resizes/re-encodes to WebP with `sharp` before
 * streaming back. The built-in Next.js /_next/image optimizer is not relied
 * upon so this works identically in every environment.
 */

// Whitelist of widths — prevents cache-busting with arbitrary sizes.
const ALLOWED_WIDTHS = [200, 400, 640, 828, 1080, 1600]

export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams.get("p")
  if (!p) return NextResponse.json({ error: "Missing pathname" }, { status: 400 })

  // `v` is a cache-busting version param — ignored for processing, only used
  // to let browsers discard stale immutably-cached responses after proxy updates.
  const wParam = request.nextUrl.searchParams.get("w")
  const requestedWidth = wParam ? Number.parseInt(wParam, 10) : null
  const width =
    requestedWidth && ALLOWED_WIDTHS.includes(requestedWidth) ? requestedWidth : null

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
    // Animated GIFs / SVGs are streamed untouched — resizing would break them.
    const isResizable = isImage && !contentType.includes("gif") && !contentType.includes("svg")

    // Long, immutable cache — blob pathnames are unique per upload.
    const immutableCache = "public, max-age=31536000, immutable"

    // Resize + re-encode images to WebP when a valid width is requested.
    // If sharp is unavailable or fails for any reason in the runtime (e.g. a
    // serverless environment where the native binary didn't load), we must NOT
    // return an error — instead fall back to streaming the original bytes so
    // the image still renders. A broken photo is far worse than an unoptimized one.
    if (width && isResizable) {
      try {
        const { default: sharp } = await import("sharp")
        const input = Buffer.from(await upstream.arrayBuffer())
        const output = await sharp(input)
          .rotate() // respect EXIF orientation
          .resize({ width, withoutEnlargement: true })
          .webp({ quality: 72 })
          .toBuffer()

        return new NextResponse(new Uint8Array(output), {
          headers: {
            "Content-Type": "image/webp",
            "Content-Length": String(output.length),
            "Cache-Control": immutableCache,
          },
        })
      } catch (resizeError) {
        console.error("[blob proxy] resize failed, serving original:", resizeError)
        // Re-fetch the original bytes (the previous response body was consumed).
        const original = await fetch(blobUrl, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (original.ok) {
          return new NextResponse(original.body, {
            headers: {
              "Content-Type": original.headers.get("content-type") ?? contentType,
              "Cache-Control": immutableCache,
            },
          })
        }
        // Fall through to the streaming path below as a last resort.
      }
    }

    // Otherwise stream the original bytes through.
    const contentLength = upstream.headers.get("content-length")
    const etag = upstream.headers.get("etag")
    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Cache-Control": isVideo
        ? "public, max-age=86400, stale-while-revalidate=604800"
        : immutableCache,
    }
    if (contentLength) headers["Content-Length"] = contentLength
    if (etag) headers["ETag"] = etag

    return new NextResponse(upstream.body, { headers })
  } catch (error) {
    console.error("[blob proxy] error:", error)
    return new NextResponse("Not found", { status: 404 })
  }
}
