import type { NextRequest } from "next/server";

import { SiteSettings } from "@/server/models";
import { siteSettingsInputSchema } from "@/lib/validation/content";
import { connectToDatabase } from "@/server/content/db";
import { toSiteSettingsDTO } from "@/server/content/serialize";
import { requireAdminApi } from "@/server/auth/guard";
import { REVALIDATE, ok, parseBody, revalidatePublic, serverError } from "@/server/api/respond";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    await connectToDatabase();
    const doc = await SiteSettings.findOne({ key: "default" }).lean().exec();
    return ok({ item: toSiteSettingsDTO(doc) });
  } catch (error) {
    return serverError("settings.get", error);
  }
}

/** Upserts the singleton, so the first save also creates it. */
export async function PUT(request: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const parsed = await parseBody(request, siteSettingsInputSchema.partial());
  if (!parsed.ok) return parsed.response;

  try {
    await connectToDatabase();

    const doc = await SiteSettings.findOneAndUpdate(
      { key: "default" },
      { $set: parsed.data, $setOnInsert: { key: "default" } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    )
      .lean()
      .exec();

    revalidatePublic([...REVALIDATE.settings]);

    return ok({ item: toSiteSettingsDTO(doc) });
  } catch (error) {
    return serverError("settings.update", error);
  }
}
