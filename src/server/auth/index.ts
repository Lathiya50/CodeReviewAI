import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "../db";

/**
 * Resolves the canonical app URL from environment variables with a safe
 * fallback so the module never crashes during Vercel's build-time static
 * page-data collection when env vars may not yet be injected.
 */
const appUrl =
  process.env.BETTER_AUTH_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GH_CLIENT_ID ?? "",
      clientSecret: process.env.GH_CLIENT_SECRET ?? "",
      scope: ["read:user", "user:email", "repo"],
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["github"],
    },
  },
  session: {
    // 7-day session lifetime. NOTE: the session *cookie* only persists across
    // browser restarts when the client auth call uses `rememberMe: true`.
    // The app passes this explicitly for email sign-in, email sign-up, and
    // GitHub OAuth sign-in to guarantee persistence in both local and prod.
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  trustedOrigins: [appUrl],
});

export type Session = typeof auth.$Infer.Session;
