import { type NextRequest, NextResponse } from "next/server"
import { get } from "@vercel/blob"

/**
 * Proxy private Vercel Blob files.
 * Usage: /api/blob?p=<pathname>
 *
 * Club and coach photos are stored in a private Blob store but shown publicly
 * on the site, so no auth check is applied here.
 */
export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.searchParams.get("p")

  if (!pathname) {
    return NextResponse.json({ error: "Missing pathname" }, { status: 400 })
  }

  try {
    const result = await get(pathname, {
      access: "private",
      ifNoneMatch: request.headers.get("if-none-match") ?? undefined,
    })

    if (!result) {
      return new NextResponse("Not found", { status: 404 })
    }

    // 304 — browser can use its cached copy
    if (result.statusCode === 304) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: result.blob.etag,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      })
    }

    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType,
        ETag: result.blob.etag,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error) {
    console.error("[blob proxy] error:", error)
    return new NextResponse("Not found", { status: 404 })
  }
}
