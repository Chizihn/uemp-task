import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  // Cache Components / Partial Prefetching optimize apps that fetch data
  // (DB, session) *inside* Next via Server Components + `use cache`. This
  // app is a client-rendered SPA shell talking to a separate NestJS REST
  // API — there's no same-app data to cache, so the flag only produced
  // dev-only "instant navigation" warnings against routes it can't help.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
