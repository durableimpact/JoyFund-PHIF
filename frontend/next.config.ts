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
  
};

export default nextConfig;
