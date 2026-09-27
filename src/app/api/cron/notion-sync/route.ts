import type { NextRequest } from "next/server";

import { SiteSettings } from "@/server/models";
import { connectToDatabase } from "@/server/content/db";
import { runSync } from "@/server/notion/sync";
import {
  REVALIDATE,
  ok,
  readSecret,
  revalidatePublic,
  serverError,
  timingSafeEqual,
} from "@/server/api/respond";
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

  if (!timingSafeEqual(readSecret(request), secret)) return notFoundResponse();

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
