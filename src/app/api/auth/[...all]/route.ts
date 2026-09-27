import { toNextJsHandler } from "better-auth/next-js";

import { getAuth } from "@/server/auth/auth";

export const dynamic = "force-dynamic";

/**
 * Better Auth is resolved per request rather than at module scope so that
 * `next build` does not need the database URL and OAuth secrets.
 */
export const { GET, POST } = toNextJsHandler((request: Request) =>
  getAuth().handler(request),
);
