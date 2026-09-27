"use client";

import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";
import { dashClient } from "@better-auth/infra/client";

/**
 * Browser auth client. It can start an OAuth flow, register a passkey and read
 * the current session — it can never grant CMS access. Every admin route and
 * API re-derives authorization on the server.
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
  plugins: [passkeyClient(), adminClient(), dashClient()],
});

export const { signIn, signOut, useSession } = authClient;
