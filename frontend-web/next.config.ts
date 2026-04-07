import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /** Avoid wrong monorepo root when a lockfile exists in the parent directory. */
  outputFileTracingRoot: __dirname
};

export default nextConfig;
