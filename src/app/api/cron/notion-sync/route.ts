import type { NextRequest } from "next/server";

import { SiteSettings } from "@/server/models";
import { connectToDatabase } from "@/server/content/db";
import { runSync } from "@/server/notion/sync";
import { REVALIDATE, ok, revalidatePublic, serverError } from "@/server/api/respond";
import { notFoundResponse } from "@/server/auth/guard";

export const dynamic = "force-dynamic";

/**
 * Scheduled Creator Buddy sync.
 *
 * Authenticated with `CRON_SECRET` rather than a session, so a scheduler can
 * call it. Without that variable the route does not exist as far as callers are
 * concerned — it answers 404 exactly like the admin APIs, so nothing reveals
 * that a sync endpoint is there.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return notFoundResponse();

  const provided =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    request.nextUrl.searchParams.get("secret") ??
    "";

  if (!timingSafeEqual(provided, secret)) return notFoundResponse();

  try {
    const report = await runSync();

    await connectToDatabase();
    await SiteSettings.findOneAndUpdate(
      { key: "default" },
      {
        $set: { "notion.lastSyncAt": new Date(report.ranAt), "notion.lastSyncOk": report.ok },
        $setOnInsert: { key: "default" },
      },
      { upsert: true, setDefaultsOnInsert: true },
    ).exec();

    revalidatePublic([...REVALIDATE.streams, ...REVALIDATE.socials, ...REVALIDATE.partners]);

    return ok({ ok: report.ok, ranAt: report.ranAt });
  } catch (error) {
    return serverError("notion.cron", error);
  }
}

/** Constant-time comparison so the secret cannot be guessed byte by byte. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }

  return diff === 0;
}
