import type { NextRequest } from "next/server";

import { Game } from "@/server/models";
import { connectToDatabase } from "@/server/content/db";
import { getAdminGameById } from "@/server/content/games";
import { requireAdminApi } from "@/server/auth/guard";
import { slugify } from "@/lib/utils";
import {
  REVALIDATE,
  missing,
  ok,
  revalidatePublic,
  serverError,
} from "@/server/api/respond";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * Duplicates a game. The copy is created deactivated and unfeatured so it never
 * appears on the public site before it has been reviewed.
 */
export async function POST(_request: NextRequest, { params }: Params) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    await connectToDatabase();

    const source = await Game.findById(id).lean().exec();
    if (!source) return missing();

    const baseName = `${String(source.name)} (Kopie)`;
    const baseSlug = slugify(baseName) || `${String(source.slug)}-kopie`;

    // Walk suffixes until an unused slug is found.
    let slug = baseSlug;
    for (let attempt = 2; attempt <= 50; attempt += 1) {
      const taken = await Game.exists({ slug });
      if (!taken) break;
      slug = `${baseSlug}-${attempt}`;
    }

    // Copy every field except the identity and timestamps, which Mongoose
    // regenerates for the new document.
    const rest: Record<string, unknown> = { ...source };
    delete rest._id;
    delete rest.createdAt;
    delete rest.updatedAt;

    const created = await Game.create({
      ...rest,
      name: baseName,
      slug,
      active: false,
      featured: false,
    });

    revalidatePublic([...REVALIDATE.games]);

    return ok({ item: await getAdminGameById(String(created._id)) }, 201);
  } catch (error) {
    return serverError("games.duplicate", error);
  }
}
