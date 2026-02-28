import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  distDir: 'dist',
  basePath: '/breakout',
  assetPrefix: '/breakout',
};

export default nextConfig;
