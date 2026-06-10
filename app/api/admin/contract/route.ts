import { type NextRequest, NextResponse } from "next/server"
import { get } from "@vercel/blob"
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
    const result = await get(pathname, {
      access: "private",
      ifNoneMatch: request.headers.get("if-none-match") ?? undefined,
    })

    if (!result) {
      return new NextResponse("Not found", { status: 404 })
    }

    if (result.statusCode === 304) {
      return new NextResponse(null, {
        status: 304,
        headers: { ETag: result.blob.etag, "Cache-Control": "private, no-cache" },
      })
    }

    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType || "application/pdf",
        ETag: result.blob.etag,
        "Cache-Control": "private, no-cache",
        "Content-Disposition": `inline; filename="${pathname.split("/").pop() ?? "contract.pdf"}"`,
      },
    })
  } catch (error) {
    console.log("[v0] Error serving contract:", error)
    return NextResponse.json({ error: "Failed to serve contract" }, { status: 500 })
  }
}
