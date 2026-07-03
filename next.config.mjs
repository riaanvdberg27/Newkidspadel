const nextConfig = {
  // Ensure sharp's native binary is treated as an external package and bundled
  // correctly into the serverless function on production (not traced/inlined).
  serverExternalPackages: ["sharp"],
  images: {
    // Serve AVIF first (best compression), fall back to WebP — browser picks best supported format.
    formats: ["image/avif", "image/webp"],
    // Explicit breakpoints matching Tailwind's sm/md/lg/xl — avoids generating unnecessary sizes.
    deviceSizes: [390, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    // Keep optimised images in the cache for 7 days before re-optimising.
    minimumCacheTTL: 60 * 60 * 24 * 7,
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
