import { type NextRequest, NextResponse } from "next/server"
import { head } from "@vercel/blob"

/**
 * Proxy private Vercel Blob files.
 * Usage: /api/blob?p=<pathname>
 *
 * Calls head() to get a short-lived pre-signed downloadUrl, then
 * redirects the browser to it. This is more reliable than streaming
 * via get() and works in all environments including production.
 */
export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.searchParams.get("p")

  if (!pathname) {
    return NextResponse.json({ error: "Missing pathname" }, { status: 400 })
  }

  try {
    const blob = await head(pathname)

    // Redirect to the pre-signed download URL — the browser fetches
    // the image directly from Blob storage. Use 302 (not 301) so
    // browsers always re-check (the signed URL expires).
    return NextResponse.redirect(blob.downloadUrl, { status: 302 })
  } catch (error) {
    console.error("[blob proxy] error:", error)
    return new NextResponse("Not found", { status: 404 })
  }
}
