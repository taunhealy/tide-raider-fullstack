/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    domains: [
      "storage.tideraider.com",
      "images.unsplash.com",
      "cdn.sanity.io",
      `${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      "media.tideraider.com",
      "assets.blueowlmedia.nz",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.tideraider.com",
        pathname: "/sessions/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
      {
        hostname: `${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      },
      {
        protocol: "https",
        hostname: "assets.blueowlmedia.nz",
      },
    ],
  },
  // Turbopack configuration
  // Note: Turbopack handles most module resolution automatically
  // If you need custom configuration, add it here
  turbopack: {
    // Turbopack automatically handles Node.js built-in modules
    // No need for explicit fallbacks like webpack
  },
  // Moved from experimental.serverComponentsExternalPackages (deprecated in Next.js 15)
  serverExternalPackages: [
    "@sparticuz/chromium",
    "@ffmpeg-installer/ffmpeg",
    "fluent-ffmpeg",
  ],
  transpilePackages: [
    "@sanity/ui",
    "@sanity/vision",
    "next-sanity",
    "styled-components",
  ],
  compiler: {
    styledComponents: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

process.env.NODE_OPTIONS = "--no-deprecation";

module.exports = nextConfig;
