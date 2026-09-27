import { Partner } from "@/server/models";
import { toPartnerDTO } from "@/server/content/serialize";
import { partnerInputSchema } from "@/lib/validation/content";
import { createCollectionHandlers } from "@/server/api/crud";
import { REVALIDATE } from "@/server/api/respond";

export const handlers = createCollectionHandlers({
  label: "partners",
  model: Partner,
  createSchema: partnerInputSchema,
  patchSchema: partnerInputSchema.partial(),
  toDTO: toPartnerDTO,
  revalidate: REVALIDATE.partners,
  sort: { sortOrder: 1, name: 1 },
  searchFields: ["name", "slug"],
  hasSlug: true,
});
