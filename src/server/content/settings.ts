import "server-only";

import { SiteSettings } from "@/server/models";
import type { SiteSettingsDTO } from "@/lib/types";

import { connectToDatabase, safeRead } from "./db";
import { toSiteSettingsDTO } from "./serialize";

/**
 * The site settings singleton. Falls back to the built-in defaults when the
 * document does not exist yet, so a fresh installation still renders correctly.
 */
export async function getSiteSettings(): Promise<SiteSettingsDTO> {
  return safeRead(
    "getSiteSettings",
    async () => {
      const doc = await SiteSettings.findOne({ key: "default" }).lean().exec();
      return toSiteSettingsDTO(doc);
    },
    toSiteSettingsDTO(null),
  );
}

/** CMS read — a failure here must surface rather than be swallowed. */
export async function getSiteSettingsForAdmin(): Promise<SiteSettingsDTO> {
  await connectToDatabase();
  const doc = await SiteSettings.findOne({ key: "default" }).lean().exec();
  return toSiteSettingsDTO(doc);
}
