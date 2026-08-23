import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/ballcomp",
  async redirects() {
    return [
      {
        source: "/",
        destination: "/ballcomp",
        basePath: false,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
