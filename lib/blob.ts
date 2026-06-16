/**
 * Converts a private Blob pathname (e.g. "clubs/123-abc.jpg") into a
 * URL that proxies through /api/blob so the image can be served to browsers.
 *
 * If the value is already a full https:// URL (legacy public URLs or external),
 * it is returned unchanged so old data keeps working.
 */
export function blobUrl(pathname: string | null | undefined): string | null {
  if (!pathname) return null
  if (pathname.startsWith("http://") || pathname.startsWith("https://")) return pathname
  return `/api/blob?p=${encodeURIComponent(pathname)}`
}
