import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  future: { webpack5: true },
  webpack: config => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
};

export default nextConfig;
