import type { NextConfig } from "next";

// next-pwa only ships CommonJS — no ESM export available, require() is the only option
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withPWA(nextConfig);
