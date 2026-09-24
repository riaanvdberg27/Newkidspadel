// Absolute origin used to build Next.js Image Optimization URLs.
// Vercel's platform optimizer only accepts ABSOLUTE same-origin source URLs
// (relative URLs with a query string are rejected with
// INVALID_IMAGE_OPTIMIZE_REQUEST), so we must hand it a full URL.
// `VERCEL_PROJECT_PRODUCTION_URL` is set on every Vercel build (prod + preview)
// and points at the canonical production domain. It is intentionally EMPTY in
// the local/v0 sandbox (no optimizer there) — the image helpers detect the
// empty value and serve original bytes through the proxy instead.
const IMAGE_ORIGIN = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : ""

const nextConfig = {
  // Inline the origin into both server and client bundles so the generated
  // image URLs are identical on both sides (no hydration mismatch).
  env: {
    NEXT_PUBLIC_IMAGE_ORIGIN: IMAGE_ORIGIN,
  },
  images: {
    // Serve AVIF first (best compression), fall back to WebP — browser picks best supported format.
    formats: ["image/avif", "image/webp"],
    // Explicit breakpoints matching Tailwind's sm/md/lg/xl — avoids generating unnecessary sizes.
    deviceSizes: [390, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    // Allowed quality values for /_next/image. 72 = gallery/thumbnails,
    // 80 = lightbox/full view, 75 = Next.js default for local static images.
    qualities: [72, 75, 80],
    // Keep optimised images in the cache for 7 days before re-optimising.
    minimumCacheTTL: 60 * 60 * 24 * 7,
    // Next.js 16 requires SAME-ORIGIN image sources with a query string to be
    // explicitly allowlisted here, separately from remotePatterns. Our proxy
    // (/api/blob?p=...) is same-origin when IMAGE_ORIGIN resolves to this
    // deployment's own domain, so without this the optimizer rejects every
    // blob-backed image with INVALID_IMAGE_OPTIMIZE_REQUEST /
    // "not configured in images.localPatterns", crashing the whole page (500).
    //
    // IMPORTANT: once ANY localPatterns entry exists, Next.js treats it as a
    // full allowlist for ALL local ("/"-prefixed) image sources — not just
    // ones with a query string. We MUST also explicitly allow every static
    // local asset directory used across the site (logo, hero photos, etc.),
    // otherwise plain `/images/*.png` requests start failing with the same
    // INVALID_IMAGE_OPTIMIZE_REQUEST error even though they have no query.
    localPatterns: [
      {
        pathname: "/api/blob",
        search: "**",
      },
      {
        pathname: "/images/**",
        search: "",
      },
    ],
    remotePatterns: [
      // Vercel Blob public store URLs (legacy / existing data)
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      // Private Blob store: the proxy serves images from the app itself.
      // Allow any HTTPS host so the /api/blob proxy works on preview
      // deployments (*.vercel.app) and on custom production domains.
      {
        protocol: "https",
        hostname: "**",
      },
      // Local dev
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },
}

export default nextConfig
