import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbo: {
      // Force Turbopack to treat the frontend folder as the root workspace
      root: __dirname,
    },
  },
};

export default nextConfig;
