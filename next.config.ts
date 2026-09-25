import type { NextConfig } from "next";
import { BASE_PATH } from "./lib/site";

const nextConfig: NextConfig = {
  basePath: BASE_PATH,
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
