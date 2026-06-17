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
