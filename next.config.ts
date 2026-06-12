import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Event photo uploads are sent as compressed data URLs (default limit is 1MB)
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
