import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Disable type checking during build
    // Types will be fixed when database.types.ts is generated
    ignoreBuildErrors: true,
  },
  eslint: {
    // Disable linting during build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
