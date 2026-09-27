import "server-only";

import { Genre } from "@/server/models";
import type { GenreDTO } from "@/lib/types";

import { connectToDatabase, safeRead } from "./db";
import { toGenreDTO } from "./serialize";

/** Active genres for the public genre filter, in CMS sort order. */
export async function listPublicGenres(): Promise<GenreDTO[]> {
  return safeRead(
    "listPublicGenres",
    async () => {
      const docs = await Genre.find({ active: true })
        .sort({ sortOrder: 1, name: 1 })
        .lean()
        .exec();

      return docs.map(toGenreDTO);
    },
    [],
  );
}

/** Every genre, including inactive ones. CMS only. */
export async function listAllGenres(search?: string): Promise<GenreDTO[]> {
  await connectToDatabase();

  const filter = search?.trim()
    ? { name: { $regex: escapeRegex(search.trim()), $options: "i" } }
    : {};

  const docs = await Genre.find(filter).sort({ sortOrder: 1, name: 1 }).lean().exec();

  return docs.map(toGenreDTO);
}

export async function getGenreById(id: string): Promise<GenreDTO | null> {
  await connectToDatabase();
  const doc = await Genre.findById(id).lean().exec();
  return doc ? toGenreDTO(doc) : null;
}

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
