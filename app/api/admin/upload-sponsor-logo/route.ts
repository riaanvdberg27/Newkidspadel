import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

/**
 * Client-upload token endpoint for sponsor logos.
 *
 * The browser uploads files DIRECTLY to Vercel Blob (via `upload()` from
 * `@vercel/blob/client`) instead of streaming them through this serverless
 * function, avoiding the ~4.5 MB serverless request-body limit.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        await requireAdmin()
        return {
          addRandomSuffix: true,
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/gif"],
          maximumSizeInBytes: 15 * 1024 * 1024,
        }
      },
      onUploadCompleted: async () => {},
    })
    return NextResponse.json(jsonResponse)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 },
    )
  }
}
