import "server-only";

import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins/admin";
import { passkey } from "@better-auth/passkey";
import { dash } from "@better-auth/infra";

import { getAuthMongo } from "./mongo";

/**
 * Better Auth is built lazily.
 *
 * Constructing it eagerly would require MONGODB_URI and the OAuth secrets at
 * module-import time, which breaks `next build` in environments that only have
 * runtime secrets. Handlers call `getAuth()` inside the request instead.
 */
const globalForAuth = globalThis as typeof globalThis & {
  __jannikjbiAuth?: ReturnType<typeof createAuth>;
};

function siteUrl(): string {
  return (
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000"
  );
}

function createAuth() {
  const { client, db } = getAuthMongo();
  const baseURL = siteUrl();
  const rpID = new URL(baseURL).hostname;

  return betterAuth({
    appName: "Jannikjbi",
    baseURL,
    secret: process.env.BETTER_AUTH_SECRET,

    database: mongodbAdapter(db, {
      client,
      // A standalone mongod (no replica set) cannot run transactions.
      transaction: process.env.MONGODB_TRANSACTIONS !== "false",
    }),

    // There is no public registration on this site. The CMS is invite-free by
    // design: exactly one identity is authorized, everyone else gets nothing.
    emailAndPassword: { enabled: false },

    socialProviders: {
      discord: {
        clientId: process.env.DISCORD_CLIENT_ID ?? "",
        clientSecret: process.env.DISCORD_CLIENT_SECRET ?? "",
      },
      twitch: {
        clientId: process.env.TWITCH_CLIENT_ID ?? "",
        clientSecret: process.env.TWITCH_CLIENT_SECRET ?? "",
      },
    },

    account: {
      accountLinking: {
        // Lets the owner attach Twitch to the same account they created with
        // Discord. Authorization itself is still decided by the linked Discord
        // account id — see `src/server/auth/authorization.ts`.
        enabled: true,
        trustedProviders: ["discord", "twitch"],
      },
    },

    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: true, maxAge: 60 * 5 },
    },

    advanced: {
      useSecureCookies: baseURL.startsWith("https://"),
    },

    plugins: [
      passkey({
        rpID,
        rpName: "Jannikjbi",
        origin: baseURL,
      }),
      admin(),
      // Auth analytics, activity monitoring and event logging.
      // Reads BETTER_AUTH_API_KEY itself; without a key it only warns.
      dash({
        apiKey: process.env.BETTER_AUTH_API_KEY,
        apiUrl: process.env.BETTER_AUTH_API_URL,
        kvUrl: process.env.BETTER_AUTH_KV_URL,
      }),
      // Must stay last so it can write cookies set by the plugins above.
      nextCookies(),
    ],
  });
}

export function getAuth() {
  return (globalForAuth.__jannikjbiAuth ??= createAuth());
}

export type Auth = ReturnType<typeof createAuth>;
