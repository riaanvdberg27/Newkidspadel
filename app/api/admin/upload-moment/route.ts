import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { type NextRequest, NextResponse } from "next/server"
import { isAdminAuthenticated } from "@/lib/admin-auth"

/**
 * Client-upload token endpoint for Next Gen Moments.
 *
 * The browser uploads files DIRECTLY to Vercel Blob (via `upload()` from
 * `@vercel/blob/client`) instead of streaming them through this serverless
 * function. This bypasses the ~4.5 MB serverless request-body limit that was
 * causing large images/videos to fail with a plain-text "Request Entity Too
 * Large" response (which broke `res.json()` on the client).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        // Admin session cookies are sent with the token request.
        if (!(await isAdminAuthenticated())) {
          throw new Error("Unauthorized")
        }
        return {
          addRandomSuffix: true,
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
            "video/mp4",
            "video/quicktime",
            "video/webm",
          ],
          // Generous ceiling; large videos are fine over direct client upload.
          maximumSizeInBytes: 200 * 1024 * 1024,
        }
      },
      // Runs only on publicly reachable deployments (Blob calls back via webhook).
      // Not needed for our flow — the client persists the moment after upload.
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
