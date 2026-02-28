import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  distDir: 'docs',
  basePath: '/breakout',
  assetPrefix: '/breakout',
};

export default nextConfig;
