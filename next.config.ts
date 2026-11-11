import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Compatibility alias: the workspace dashboard now lives at /dashboard.
      { source: "/workspace/dashboard", destination: "/dashboard", permanent: false },
    ];
  },
};

export default nextConfig;
