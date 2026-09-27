import type { NextRequest } from "next/server";

import { seedContent } from "@/server/content/seed";
import { notFoundResponse } from "@/server/auth/guard";
import {
  REVALIDATE,
  ok,
  readSecret,
  revalidatePublic,
  serverError,
  timingSafeEqual,
} from "@/server/api/respond";

export const dynamic = "force-dynamic";

/**
 * One-off content seed for a fresh deployment.
 *
 * Authenticated with `SEED_SECRET` rather than a session, so it can be run
 * against production from anywhere. Without that variable the route answers a
 * plain 404, exactly like the admin APIs — once the secret is removed, the
 * endpoint is effectively gone.
 *
 * `seedContent()` is idempotent, so calling this twice is harmless.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.SEED_SECRET?.trim();
  if (!secret) return notFoundResponse();

  if (!timingSafeEqual(readSecret(request), secret)) return notFoundResponse();

  try {
    const report = await seedContent();

    revalidatePublic([
      ...REVALIDATE.games,
      ...REVALIDATE.projects,
      ...REVALIDATE.socials,
      ...REVALIDATE.partners,
    ]);

    return ok(report);
  } catch (error) {
    return serverError("admin.seed", error);
  }
}
