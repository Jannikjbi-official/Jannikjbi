import type { NextRequest } from "next/server";

import { Stream } from "@/server/models";
import { streamInputSchema } from "@/lib/validation/content";
import { listAdminStreams } from "@/server/content/streams";
import { connectToDatabase } from "@/server/content/db";
import { toStreamDTO } from "@/server/content/serialize";
import { requireAdminApi } from "@/server/auth/guard";
import { REVALIDATE, ok, parseBody, revalidatePublic, serverError } from "@/server/api/respond";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const params = request.nextUrl.searchParams;
    const scope = params.get("scope");

    const result = await listAdminStreams({
      q: params.get("q") ?? undefined,
      page: Math.max(1, Number(params.get("page")) || 1),
      perPage: Math.min(100, Math.max(1, Number(params.get("perPage")) || 20)),
      scope:
        scope === "kommend" || scope === "vergangen" || scope === "alle" ? scope : "alle",
    });

    return ok(result);
  } catch (error) {
    return serverError("streams.list", error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const parsed = await parseBody(request, streamInputSchema);
  if (!parsed.ok) return parsed.response;

  try {
    await connectToDatabase();

    const created = await Stream.create(parsed.data);
    const doc = await Stream.findById(created._id)
      .populate({ path: "game", select: { name: 1, slug: 1 } })
      .lean()
      .exec();

    revalidatePublic([...REVALIDATE.streams]);

    return ok({ item: toStreamDTO(doc as Record<string, unknown>) }, 201);
  } catch (error) {
    return serverError("streams.create", error);
  }
}
