import { type NextRequest, NextResponse } from "next/server"
import { head } from "@vercel/blob"
import { isAdminAuthenticated } from "@/lib/admin-auth"

// Streams a signed contract PDF from the private Blob store to authenticated admins only.
export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const pathname = request.nextUrl.searchParams.get("pathname")
  if (!pathname) {
    return NextResponse.json({ error: "Missing pathname" }, { status: 400 })
  }

  // Only ever serve files from the contracts/ prefix.
  if (!pathname.startsWith("contracts/")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    // Use head() to resolve the blob metadata (including the full private URL),
    // then fetch the content directly from that URL and stream it to the client.
    const token = process.env.BLOB_READ_WRITE_TOKEN
    if (!token) {
      return NextResponse.json({ error: "Blob token not configured" }, { status: 500 })
    }

    const metadata = await head(pathname, { token })
    if (!metadata) {
      return new NextResponse("Contract not found", { status: 404 })
    }

    // Fetch the actual PDF bytes using the resolved URL
    const upstream = await fetch(metadata.downloadUrl ?? metadata.url, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!upstream.ok) {
      return NextResponse.json({ error: `Blob store returned ${upstream.status}` }, { status: 502 })
    }

    const filename = pathname.split("/").pop() ?? "contract.pdf"
    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type": metadata.contentType || "application/pdf",
        "Cache-Control": "private, no-cache",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error("[v0] Error serving contract:", msg)
    return NextResponse.json({ error: `Failed to serve contract: ${msg}` }, { status: 500 })
  }
}
