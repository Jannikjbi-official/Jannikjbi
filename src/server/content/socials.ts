import "server-only";

import { SocialLink } from "@/server/models";
import type { SocialLinkDTO } from "@/lib/types";

import { connectToDatabase, safeRead } from "./db";
import { toSocialLinkDTO } from "./serialize";

/** Deactivating a social link in the CMS removes it from the site at once. */
export async function listPublicSocialLinks(): Promise<SocialLinkDTO[]> {
  return safeRead(
    "listPublicSocialLinks",
    async () => {
      const docs = await SocialLink.find({ active: true })
        .sort({ sortOrder: 1, platform: 1 })
        .lean()
        .exec();

      return docs.map(toSocialLinkDTO);
    },
    [],
  );
}

export async function listAllSocialLinks(): Promise<SocialLinkDTO[]> {
  await connectToDatabase();
  const docs = await SocialLink.find({}).sort({ sortOrder: 1, platform: 1 }).lean().exec();
  return docs.map(toSocialLinkDTO);
}
