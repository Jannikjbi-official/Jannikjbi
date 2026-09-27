import type { NextRequest } from "next/server";

import { Game } from "@/server/models";
import { GAME_STATUSES, type GameStatus } from "@/lib/content-constants";
import { gameInputSchema } from "@/lib/validation/content";
import { listAdminGames } from "@/server/content/games";
import { connectToDatabase } from "@/server/content/db";
import { getAdminGameById } from "@/server/content/games";
import { requireAdminApi } from "@/server/auth/guard";
import {
  REVALIDATE,
  conflict,
  isDuplicateKeyError,
  ok,
  parseBody,
  revalidatePublic,
  serverError,
} from "@/server/api/respond";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const params = request.nextUrl.searchParams;
    const statusParam = params.get("status");
    const activeParam = params.get("active");

    const result = await listAdminGames({
      q: params.get("q") ?? undefined,
      page: Math.max(1, Number(params.get("page")) || 1),
      perPage: Math.min(100, Math.max(1, Number(params.get("perPage")) || 20)),
      status: GAME_STATUSES.includes(statusParam as GameStatus)
        ? (statusParam as GameStatus)
        : undefined,
      genreId: params.get("genreId") || undefined,
      active:
        activeParam === "true" ? true : activeParam === "false" ? false : undefined,
    });

    return ok(result);
  } catch (error) {
    return serverError("games.list", error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const parsed = await parseBody(request, gameInputSchema);
  if (!parsed.ok) return parsed.response;

  try {
    await connectToDatabase();

    const created = await Game.create(parsed.data);
    const item = await getAdminGameById(String(created._id));

    revalidatePublic([...REVALIDATE.games]);

    return ok({ item }, 201);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return conflict("Dieser Slug ist bereits vergeben.", {
        slug: "Dieser Slug ist bereits vergeben.",
      });
    }
    return serverError("games.create", error);
  }
}
