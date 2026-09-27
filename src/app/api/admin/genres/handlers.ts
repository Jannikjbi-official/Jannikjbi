import { Genre } from "@/server/models";
import { toGenreDTO } from "@/server/content/serialize";
import { genreInputSchema } from "@/lib/validation/content";
import { createCollectionHandlers } from "@/server/api/crud";
import { REVALIDATE } from "@/server/api/respond";

export const handlers = createCollectionHandlers({
  label: "genres",
  model: Genre,
  createSchema: genreInputSchema,
  patchSchema: genreInputSchema.partial(),
  toDTO: toGenreDTO,
  revalidate: REVALIDATE.genres,
  sort: { sortOrder: 1, name: 1 },
  searchFields: ["name", "slug"],
  hasSlug: true,
});
