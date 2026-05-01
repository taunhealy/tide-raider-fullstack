/** @type {import('next').NextConfig} */
const { withSentryConfig } = require("@sentry/nextjs");

const nextConfig = {
  images: {
    unoptimized: true,
    domains: [
      "storage.tideraider.com",
      "images.unsplash.com",
      "cdn.sanity.io",
      `${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      "media.tideraider.com",
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

// Injected content via Sentry wizard below

module.exports = withSentryConfig(
  nextConfig,
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    // Suppresses source map uploading logs during bundling
    silent: true,
    org: "taun-healy",
    project: "tide-raider",
  },
  {
    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Transpiles Sentry libraries to support IE11 (increases bundle size)
    transpileClientSDK: true,

    // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
    tunnelRoute: "/monitoring",

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors.
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,
  }
);
