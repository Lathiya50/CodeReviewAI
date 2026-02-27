import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  /**
   * Prevent Prisma Client, better-auth, and Inngest from being bundled
   * into the Next.js server bundle. Vercel evaluates server chunks at
   * build time during page-data collection; if these modules crash on
   * missing env vars they fail the entire build with a cryptic turbopack
   * module-evaluation error on /api/trpc/[trpc].
   */
  serverExternalPackages: [
    "@prisma/client",
    "prisma",
    "better-auth",
    "inngest",
  ],
};

export default nextConfig;
