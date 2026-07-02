/**
 * Returns a browser-loadable URL for any stored image value.
 *
 * Private Vercel Blob URLs (*.private.blob.vercel-storage.com) cannot be
 * fetched directly by browsers — they require an Authorization header.
 * This function always routes through the /api/blob proxy which adds the
 * token server-side, regardless of whether the stored value is a full URL
 * or a bare pathname.
 */
export function blobUrl(pathname: string | null | undefined): string | null {
  if (!pathname) return null
  // Always proxy — the route handler accepts both full URLs and bare paths.
  return `/api/blob?p=${encodeURIComponent(pathname)}`
}

// Widths the /api/blob proxy is allowed to resize to (must match the route).
const IMAGE_WIDTHS = [200, 400, 640, 828, 1080, 1600]

// Cache-bust version — bump this if the proxy logic changes and browsers need
// to discard stale immutably-cached responses.
const V = "2"

/**
 * Returns a proxied URL that resizes the image to `width` (WebP) server-side.
 * Use for a single fixed-size <img> src fallback.
 */
export function blobImage(pathname: string | null | undefined, width = 828): string | null {
  if (!pathname) return null
  return `/api/blob?p=${encodeURIComponent(pathname)}&w=${width}&v=${V}`
}

/**
 * Builds a responsive srcset string of resized WebP variants through the
 * proxy, e.g. "/api/blob?p=..&w=200 200w, /api/blob?p=..&w=400 400w, …".
 * Pair with a `sizes` attribute so the browser downloads the smallest
 * variant that fits the layout — turning multi-MB originals into a few KB.
 */
export function blobSrcSet(pathname: string | null | undefined): string | undefined {
  if (!pathname) return undefined
  const enc = encodeURIComponent(pathname)
  return IMAGE_WIDTHS.map((w) => `/api/blob?p=${enc}&w=${w}&v=${V} ${w}w`).join(", ")
}
