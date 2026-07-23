/**
 * Returns a browser-loadable URL for the ORIGINAL bytes of a stored media value.
 *
 * Private Vercel Blob URLs (*.private.blob.vercel-storage.com) cannot be
 * fetched directly by browsers — they require an Authorization header. This
 * routes through the /api/blob proxy, which adds the token server-side.
 *
 * Use this for videos, downloads, and any place that needs the untouched file.
 */
export function blobUrl(pathname: string | null | undefined): string | null {
  if (!pathname) return null
  return `/api/blob?p=${encodeURIComponent(pathname)}`
}

/**
 * Absolute origin for Next.js Image Optimization, inlined at build time.
 * Non-empty ONLY on Vercel (prod + preview). Empty in the local/v0 sandbox,
 * where the platform optimizer isn't available.
 */
const IMAGE_ORIGIN = process.env.NEXT_PUBLIC_IMAGE_ORIGIN ?? ""
/** Whether to route images through Vercel's /_next/image optimizer. */
const USE_OPTIMIZER = IMAGE_ORIGIN.length > 0

/**
 * Widths the optimizer may resize to. Every value MUST exist in next.config's
 * images.deviceSizes / imageSizes, otherwise /_next/image returns 400.
 */
const OPT_WIDTHS = [256, 390, 640, 750, 828, 1080, 1200, 1920]
/** Curated subset used for responsive <img srcSet> in grids/galleries. */
const SRCSET_WIDTHS = [256, 390, 640, 828, 1080]
/** Default quality — must be listed in next.config's images.qualities. */
const GRID_QUALITY = 72

function snapWidth(width: number): number {
  return OPT_WIDTHS.find((w) => w >= width) ?? OPT_WIDTHS[OPT_WIDTHS.length - 1]
}

/**
 * Build a Vercel Image Optimization URL for a proxied blob.
 *
 * We delegate resizing/format-conversion to Vercel's built-in optimizer at
 * /_next/image rather than doing it ourselves (which needs `sharp` and fails
 * in some serverless runtimes). The optimizer fetches the ORIGINAL bytes from
 * our /api/blob proxy, then serves a resized AVIF/WebP — turning multi-MB
 * originals into a few KB, cached heavily on the CDN.
 *
 * The proxy source MUST be an absolute URL: Vercel's platform optimizer rejects
 * relative URLs that contain a query string (INVALID_IMAGE_OPTIMIZE_REQUEST).
 */
function optimized(pathname: string, width: number, quality: number): string {
  const proxy = `${IMAGE_ORIGIN}/api/blob?p=${encodeURIComponent(pathname)}`
  return `/_next/image?url=${encodeURIComponent(proxy)}&w=${width}&q=${quality}`
}

/**
 * A single display-ready image URL for the given render width.
 *
 * On Vercel: an optimized (resized WebP/AVIF) URL.
 * In the sandbox: the original bytes via the proxy (optimizer unavailable) —
 * visible in preview; final size only matters in production.
 */
export function blobImage(
  pathname: string | null | undefined,
  width = 828,
  quality: number = GRID_QUALITY,
): string | null {
  if (!pathname) return null
  // Local/public paths and public HTTPS URLs don't need blob proxy
  if (pathname.startsWith("/") || pathname.startsWith("https://")) return pathname
  const w = snapWidth(width)
  // Sandbox (no Vercel optimizer): ask the proxy to resize with sharp — which
  // works locally — so preview downloads small images instead of the multi-MB
  // originals. On production this branch is never taken.
  if (!USE_OPTIMIZER) return `/api/blob?p=${encodeURIComponent(pathname)}&w=${w}&q=${quality}`
  return optimized(pathname, w, quality)
}

/**
 * A responsive srcSet of optimized variants. Pair with a `sizes` attribute so
 * the browser downloads the smallest variant that fits the layout.
 *
 * Returns undefined in the sandbox (no optimizer) — callers fall back to the
 * single `src` from blobImage().
 */
export function blobSrcSet(
  pathname: string | null | undefined,
  quality: number = GRID_QUALITY,
): string | undefined {
  if (!pathname || !USE_OPTIMIZER) return undefined
  return SRCSET_WIDTHS.map((w) => `${optimized(pathname, w, quality)} ${w}w`).join(", ")
}
