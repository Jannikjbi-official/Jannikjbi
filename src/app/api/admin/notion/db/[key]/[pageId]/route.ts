import type { NextRequest } from "next/server";
import { z } from "zod";

import { NOTION_DB_KEYS, type NotionDbKey } from "@/lib/notion-manage-types";
import { NotionError, notionMessage } from "@/server/notion/client";
import { archiveRow, updateRow } from "@/server/notion/manage";
import { requireAdminApi } from "@/server/auth/guard";
import { badRequest, ok, parseBody, serverError } from "@/server/api/respond";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ key: string; pageId: string }> };

const bodySchema = z.object({ values: z.record(z.string(), z.unknown()) });

function parseKey(value: string): NotionDbKey | null {
  return NOTION_DB_KEYS.find((candidate) => candidate === value) ?? null;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const { key: rawKey, pageId } = await params;
  const key = parseKey(rawKey);
  if (!key) return badRequest("Unbekannter Bereich.");

  const parsed = await parseBody(request, bodySchema);
  if (!parsed.ok) return parsed.response;

  try {
    await updateRow(key, pageId, parsed.data.values);
    return ok({ updated: true });
  } catch (error) {
    if (error instanceof NotionError) return badRequest(notionMessage(error));
    return serverError("notion.update", error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const { pageId } = await params;

  try {
    // Notion has no hard delete via the API; this is what "Delete" does in the
    // Notion UI too, so the entry stays restorable from the trash there.
    await archiveRow(pageId);
    return ok({ archived: true });
  } catch (error) {
    if (error instanceof NotionError) return badRequest(notionMessage(error));
    return serverError("notion.archive", error);
  }
}
