/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      // Next.js caps Server Action request bodies at 1MB by default. Photo uploads (spot
      // photos, avatars) go through Server Actions as multipart FormData, so anything above
      // 1MB crashed with "Body exceeded 1 MB limit" before our own 5MB check in
      // lib/storage/upload.ts ever ran. 8mb leaves headroom over that 5MB app-level cap for
      // multipart overhead (boundaries, part headers).
      bodySizeLimit: '8mb',
    },
  },
}

export default nextConfig
