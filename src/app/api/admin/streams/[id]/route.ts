import type { NextRequest } from "next/server";

import { Stream } from "@/server/models";
import { streamPatchSchema } from "@/lib/validation/content";
import { connectToDatabase } from "@/server/content/db";
import { toStreamDTO } from "@/server/content/serialize";
import { requireAdminApi } from "@/server/auth/guard";
import {
  REVALIDATE,
  badRequest,
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
    await connectToDatabase();

    const doc = await Stream.findById(id)
      .populate({ path: "game", select: { name: 1, slug: 1 } })
      .lean()
      .exec();

    if (!doc) return missing();

    return ok({ item: toStreamDTO(doc as Record<string, unknown>) });
  } catch (error) {
    return serverError("streams.getOne", error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const parsed = await parseBody(request, streamPatchSchema);
  if (!parsed.ok) return parsed.response;

  if (Object.keys(parsed.data).length === 0) {
    return badRequest("Keine Änderungen übermittelt.");
  }

  try {
    const { id } = await params;
    await connectToDatabase();

    const doc = await Stream.findByIdAndUpdate(
      id,
      { $set: parsed.data },
      { new: true, runValidators: true },
    )
      .populate({ path: "game", select: { name: 1, slug: 1 } })
      .lean()
      .exec();

    if (!doc) return missing();

    revalidatePublic([...REVALIDATE.streams]);

    return ok({ item: toStreamDTO(doc as Record<string, unknown>) });
  } catch (error) {
    return serverError("streams.update", error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    await connectToDatabase();

    const deleted = await Stream.findByIdAndDelete(id).lean().exec();
    if (!deleted) return missing();

    revalidatePublic([...REVALIDATE.streams]);

    return ok({ deleted: true });
  } catch (error) {
    return serverError("streams.remove", error);
  }
}
