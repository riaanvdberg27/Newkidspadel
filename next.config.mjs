const nextConfig = {
  images: {
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
