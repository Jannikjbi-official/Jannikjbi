import { SocialLink } from "@/server/models";
import { toSocialLinkDTO } from "@/server/content/serialize";
import { socialLinkInputSchema } from "@/lib/validation/content";
import { createCollectionHandlers } from "@/server/api/crud";
import { REVALIDATE } from "@/server/api/respond";

export const handlers = createCollectionHandlers({
  label: "socials",
  model: SocialLink,
  createSchema: socialLinkInputSchema,
  patchSchema: socialLinkInputSchema.partial(),
  toDTO: toSocialLinkDTO,
  revalidate: REVALIDATE.socials,
  sort: { sortOrder: 1, platform: 1 },
  searchFields: ["label", "handle", "platform"],
  hasSlug: false,
});
