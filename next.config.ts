import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removed 'export' to enable API routes for chat
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
