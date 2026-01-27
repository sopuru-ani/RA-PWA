import type { NextConfig } from "next";
import withPWA from "next-pwa";
import runtimeCaching from "next-pwa/cache";

const nextConfig: any = {
  reactStrictMode: true,
  allowedDevOrigins: [
    "10.238.204.166",
    "10.247.136.150",
    "10.21.211.13",
    "10.21.211.14",
    "10.22.146.105",
    "http://localhost:3000",
    "https://localhost:3000",
    "http://10.21.211.13:3000",
    "https://10.21.211.13:3000",
    "https://10.247.136.150:3000",
    "https://10.238.204.166:3000",
  ],

  // Turbopack optional
  turbopack: {},

  // ✅ Enable App Router explicitly
  experimental: {
    appDir: true,
  },
};

export default withPWA({
  dest: "public",
  runtimeCaching,
  disable: process.env.NODE_ENV === "development",
})(nextConfig);
