/**
 * Returns a browser-loadable URL for any stored media value (ORIGINAL bytes).
 *
 * Private Vercel Blob URLs (*.private.blob.vercel-storage.com) cannot be
 * fetched directly by browsers — they require an Authorization header.
 * This routes through the /api/blob proxy which adds the token server-side.
 *
 * Use this for videos, downloads, and as the source that the Next.js image
 * optimizer fetches (see blobImage / blobSrcSet below).
 */
export function blobUrl(pathname: string | null | undefined): string | null {
  if (!pathname) return null
  return `/api/blob?p=${encodeURIComponent(pathname)}`
}

/**
 * Widths the Next.js image optimizer may resize to. Every value MUST exist in
 * next.config's images.deviceSizes / imageSizes, otherwise /_next/image 400s.
 */
const OPT_WIDTHS = [256, 390, 640, 750, 828, 1080, 1200, 1920]
// Curated subset used for responsive <img srcSet> in grids/galleries.
const SRCSET_WIDTHS = [256, 390, 640, 828, 1080]
// Default quality — must be listed in next.config's images.qualities.
const GRID_QUALITY = 72

/**
 * Build a Next.js Image Optimization URL for a proxied blob.
 *
 * Rather than resizing images ourselves (which requires `sharp` and fails in
 * some serverless runtimes), we delegate resizing/format-conversion to Vercel's
 * built-in optimizer at /_next/image. It fetches the ORIGINAL bytes from our
 * same-origin /api/blob proxy, then serves a resized AVIF/WebP — turning
 * multi-MB originals into a few KB, with heavy CDN caching.
 */
function optimized(pathname: string, width: number, quality: number): string {
  const proxy = `/api/blob?p=${encodeURIComponent(pathname)}`
  return `/_next/image?url=${encodeURIComponent(proxy)}&w=${width}&q=${quality}`
}

function snapWidth(width: number): number {
  return OPT_WIDTHS.find((w) => w >= width) ?? OPT_WIDTHS[OPT_WIDTHS.length - 1]
}

/**
 * A single optimized (resized, WebP/AVIF) image URL. Use as the <img> `src`.
 */
export function blobImage(
  pathname: string | null | undefined,
  width = 828,
  quality: number = GRID_QUALITY,
): string | null {
  if (!pathname) return null
  return optimized(pathname, snapWidth(width), quality)
}

/**
 * A responsive srcSet of optimized variants. Pair with a `sizes` attribute so
 * the browser downloads the smallest variant that fits the layout.
 */
export function blobSrcSet(
  pathname: string | null | undefined,
  quality: number = GRID_QUALITY,
): string | undefined {
  if (!pathname) return undefined
  return SRCSET_WIDTHS.map((w) => `${optimized(pathname, w, quality)} ${w}w`).join(", ")
}
