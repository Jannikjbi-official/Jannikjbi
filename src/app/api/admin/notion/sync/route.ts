import type { NextRequest } from "next/server";
import { z } from "zod";

import { NOTION_RESOURCES } from "@/lib/notion-constants";
import { SiteSettings } from "@/server/models";
import { connectToDatabase } from "@/server/content/db";
import { runSync } from "@/server/notion/sync";
import { requireAdminApi } from "@/server/auth/guard";
import {
  REVALIDATE,
  ok,
  parseBody,
  revalidatePublic,
  serverError,
} from "@/server/api/respond";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  resources: z.array(z.enum(NOTION_RESOURCES)).min(1).optional(),
});

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const parsed = await parseBody(request, bodySchema);
  if (!parsed.ok) return parsed.response;

  try {
    const report = await runSync(parsed.data.resources);

    await connectToDatabase();
    await SiteSettings.findOneAndUpdate(
      { key: "default" },
      {
        $set: { "notion.lastSyncAt": new Date(report.ranAt), "notion.lastSyncOk": report.ok },
        $setOnInsert: { key: "default" },
      },
      { upsert: true, setDefaultsOnInsert: true },
    ).exec();

    // A pull can change the schedule, the social links and the partners, so
    // every public surface they appear on is refreshed.
    revalidatePublic([...REVALIDATE.streams, ...REVALIDATE.socials, ...REVALIDATE.partners]);

    return ok(report);
  } catch (error) {
    return serverError("notion.sync", error);
  }
}
