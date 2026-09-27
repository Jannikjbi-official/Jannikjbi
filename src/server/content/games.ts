import "server-only";

import type { QueryFilter, SortOrder } from "mongoose";

import { Game, type GameDoc } from "@/server/models";
import {
  GAME_SORT_LABELS,
  GAME_SORTS,
  type GameSort,
  type GameStatus,
} from "@/lib/content-constants";
import type { GameDTO, Paginated } from "@/lib/types";

import { connectToDatabase, safeRead } from "./db";
import { escapeRegex } from "./genres";
import { toGameDTO } from "./serialize";

export type PublicGameFilters = {
  search?: string;
  genreSlug?: string;
  status?: GameStatus;
  sort?: GameSort;
};

// Re-exported for the server-side callers that already import from here.
export { GAME_SORTS, GAME_SORT_LABELS, type GameSort };

function sortSpec(sort: GameSort | undefined): Record<string, SortOrder> {
  switch (sort) {
    case "name":
      return { name: 1 };
    case "neueste":
      return { createdAt: -1 };
    case "release":
      return { releaseDate: -1, name: 1 };
    default:
      return { featured: -1, sortOrder: 1, name: 1 };
  }
}

/**
 * Public game list. Inactive games are never returned, so deactivating a game
 * in the CMS removes it from every public surface immediately.
 */
export async function listPublicGames(filters: PublicGameFilters = {}): Promise<GameDTO[]> {
  return safeRead(
    "listPublicGames",
    async () => {
      const filter: QueryFilter<GameDoc> = { active: true };

      if (filters.status) filter.status = filters.status;

      if (filters.search?.trim()) {
        const pattern = escapeRegex(filters.search.trim());
        filter.$or = [
          { name: { $regex: pattern, $options: "i" } },
          { tagline: { $regex: pattern, $options: "i" } },
          { description: { $regex: pattern, $options: "i" } },
        ];
      }

      let query = Game.find(filter).populate({
        path: "genres",
        match: { active: true },
        options: { sort: { sortOrder: 1, name: 1 } },
      });

      query = query.sort(sortSpec(filters.sort));

      const docs = await query.lean().exec();
      const games = docs.map(toGameDTO);

      // Genre filtering runs after populate so it can match on the slug
      // without a second round-trip for the genre id.
      if (filters.genreSlug) {
        return games.filter((game) =>
          game.genres.some((genre) => genre.slug === filters.genreSlug),
        );
      }

      return games;
    },
    [],
  );
}

export async function listFeaturedGames(limit = 3): Promise<GameDTO[]> {
  return safeRead(
    "listFeaturedGames",
    async () => {
      const docs = await Game.find({ active: true, featured: true })
        .populate({ path: "genres", match: { active: true } })
        .sort({ sortOrder: 1, name: 1 })
        .limit(limit)
        .lean()
        .exec();

      return docs.map(toGameDTO);
    },
    [],
  );
}

/** Games for the homepage: currently played first, featured pinned to the top. */
export async function listCurrentGames(limit = 6): Promise<GameDTO[]> {
  return safeRead(
    "listCurrentGames",
    async () => {
      const docs = await Game.find({ active: true, status: "aktuell" })
        .populate({ path: "genres", match: { active: true } })
        .sort({ featured: -1, sortOrder: 1, name: 1 })
        .limit(limit)
        .lean()
        .exec();

      return docs.map(toGameDTO);
    },
    [],
  );
}

export async function getPublicGameBySlug(slug: string): Promise<GameDTO | null> {
  return safeRead(
    "getPublicGameBySlug",
    async () => {
      const doc = await Game.findOne({ slug, active: true })
        .populate({
          path: "genres",
          match: { active: true },
          options: { sort: { sortOrder: 1, name: 1 } },
        })
        .lean()
        .exec();

      return doc ? toGameDTO(doc) : null;
    },
    null,
  );
}

/** Slugs for the sitemap and for `generateStaticParams`. */
export async function listPublicGameSlugs(): Promise<string[]> {
  return safeRead(
    "listPublicGameSlugs",
    async () => {
      const docs = await Game.find({ active: true }).select({ slug: 1 }).lean().exec();
      return docs.map((doc) => String(doc.slug));
    },
    [],
  );
}

/* -------------------------------------------------------------------------- */
/* CMS                                                                        */
/* -------------------------------------------------------------------------- */

export type AdminGameQuery = {
  q?: string;
  page: number;
  perPage: number;
  status?: GameStatus;
  genreId?: string;
  active?: boolean;
};

export async function listAdminGames(query: AdminGameQuery): Promise<Paginated<GameDTO>> {
  await connectToDatabase();

  const filter: QueryFilter<GameDoc> = {};

  if (query.status) filter.status = query.status;
  if (typeof query.active === "boolean") filter.active = query.active;
  if (query.genreId) filter.genres = query.genreId;

  if (query.q?.trim()) {
    const pattern = escapeRegex(query.q.trim());
    filter.$or = [
      { name: { $regex: pattern, $options: "i" } },
      { slug: { $regex: pattern, $options: "i" } },
    ];
  }

  const [docs, total] = await Promise.all([
    Game.find(filter)
      .populate({ path: "genres" })
      .sort({ sortOrder: 1, name: 1 })
      .skip((query.page - 1) * query.perPage)
      .limit(query.perPage)
      .lean()
      .exec(),
    Game.countDocuments(filter).exec(),
  ]);

  return {
    items: docs.map(toGameDTO),
    total,
    page: query.page,
    perPage: query.perPage,
    totalPages: Math.max(1, Math.ceil(total / query.perPage)),
  };
}

export async function getAdminGameById(id: string): Promise<GameDTO | null> {
  await connectToDatabase();
  const doc = await Game.findById(id).populate({ path: "genres" }).lean().exec();
  return doc ? toGameDTO(doc) : null;
}
