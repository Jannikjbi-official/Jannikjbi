import { Project } from "@/server/models";
import { toProjectDTO } from "@/server/content/serialize";
import { projectInputSchema } from "@/lib/validation/content";
import { createCollectionHandlers } from "@/server/api/crud";
import { REVALIDATE } from "@/server/api/respond";

export const handlers = createCollectionHandlers({
  label: "projects",
  model: Project,
  createSchema: projectInputSchema,
  patchSchema: projectInputSchema.partial(),
  toDTO: toProjectDTO,
  revalidate: REVALIDATE.projects,
  sort: { sortOrder: 1, name: 1 },
  searchFields: ["name", "slug"],
  hasSlug: true,
});
