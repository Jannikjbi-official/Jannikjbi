import type { NextRequest } from "next/server";

import { Game } from "@/server/models";
import { gameInputSchema } from "@/lib/validation/content";
import { getAdminGameById } from "@/server/content/games";
import { connectToDatabase } from "@/server/content/db";
import { requireAdminApi } from "@/server/auth/guard";
import {
  REVALIDATE,
  badRequest,
  conflict,
  isDuplicateKeyError,
  missing,
  ok,
  parseBody,
  revalidatePublic,
  serverError,
} from "@/server/api/respond";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const item = await getAdminGameById(id);
    if (!item) return missing();
    return ok({ item });
  } catch (error) {
    return serverError("games.getOne", error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const parsed = await parseBody(request, gameInputSchema.partial());
  if (!parsed.ok) return parsed.response;

  if (Object.keys(parsed.data).length === 0) {
    return badRequest("Keine Änderungen übermittelt.");
  }

  try {
    const { id } = await params;
    await connectToDatabase();

    const updated = await Game.findByIdAndUpdate(
      id,
      { $set: parsed.data },
      { new: true, runValidators: true },
    )
      .lean()
      .exec();

    if (!updated) return missing();

    revalidatePublic([...REVALIDATE.games, `/games/${String(updated.slug)}`]);

    return ok({ item: await getAdminGameById(id) });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return conflict("Dieser Slug ist bereits vergeben.", {
        slug: "Dieser Slug ist bereits vergeben.",
      });
    }
    return serverError("games.update", error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    await connectToDatabase();

    const deleted = await Game.findByIdAndDelete(id).lean().exec();
    if (!deleted) return missing();

    revalidatePublic([...REVALIDATE.games, `/games/${String(deleted.slug)}`]);

    return ok({ deleted: true });
  } catch (error) {
    return serverError("games.remove", error);
  }
}
