import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    // Next.js build output
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Auto-generated PWA service worker files (produced by next-pwa at build time).
    // Linting these causes ~90 warnings from minified vendored code — not our code.
    "public/sw.js",
    "public/workbox-*.js",
  ]),
]);

export default eslintConfig;
