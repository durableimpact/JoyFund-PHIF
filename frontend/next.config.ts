import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Enhanced image configuration
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60, // Cache optimized images for 60 seconds
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  output: "standalone",
  compress: true,
  
  // Enable Next.js development logging to help trace fetches, server actions,
  // and incoming requests. See: https://nextjs.org/docs/app/api-reference/config/next-config-js/logging
  logging: {
    // Log server-side `fetch` calls with full URL and HMR refreshes
    fetches: {
      fullUrl: true,
      hmrRefreshes: true,
    },
    // Keep server function (Server Actions) call logging enabled in dev
    serverFunctions: true,
    // Forward browser console warnings/errors to the terminal (dev only)
    browserToTerminal: 'warn',
    // Keep incoming request logging enabled (defaults to true in dev)
    incomingRequests: true,
  },
};

export default nextConfig;
