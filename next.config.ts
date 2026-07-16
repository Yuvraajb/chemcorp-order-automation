import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  // Keep better-sqlite3 external so the native binding loads at runtime.
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
