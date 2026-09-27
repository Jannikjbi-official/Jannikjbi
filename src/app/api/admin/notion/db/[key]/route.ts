import type { NextRequest } from "next/server";
import { z } from "zod";

import { NOTION_DB_KEYS } from "@/lib/notion-manage-types";
import { NotionError } from "@/server/notion/client";
import { createRow, loadTable } from "@/server/notion/manage";
import { requireAdminApi } from "@/server/auth/guard";
import { badRequest, ok, parseBody, serverError } from "@/server/api/respond";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ key: string }> };

const bodySchema = z.object({ values: z.record(z.string(), z.unknown()) });

/** Narrows the route segment to a known database key. */
function parseKey(value: string) {
  const match = NOTION_DB_KEYS.find((candidate) => candidate === value);
  return match ?? null;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const key = parseKey((await params).key);
  if (!key) return badRequest("Unbekannter Bereich.");

  try {
    return ok(await loadTable(key));
  } catch (error) {
    if (error instanceof NotionError) {
      return badRequest(notionMessage(error));
    }
    return serverError("notion.table", error);
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const key = parseKey((await params).key);
  if (!key) return badRequest("Unbekannter Bereich.");

  const parsed = await parseBody(request, bodySchema);
  if (!parsed.ok) return parsed.response;

  try {
    return ok({ id: await createRow(key, parsed.data.values) }, 201);
  } catch (error) {
    if (error instanceof NotionError) {
      return badRequest(notionMessage(error));
    }
    return serverError("notion.create", error);
  }
}

/**
 * Notion's own message is the most useful thing to show here — it names the
 * property that was rejected. It never contains a secret.
 */
export function notionMessage(error: NotionError): string {
  if (error.code === "object_not_found") {
    return "Notion findet diese Datenbank nicht. Ist die Seite „Creator Buddy Dashboard“ mit der Integration geteilt?";
  }
  if (error.code === "unauthorized") {
    return "Notion hat den Zugriff abgelehnt. Bitte NOTION_TOKEN prüfen.";
  }
  if (error.code === "not_configured") {
    return error.message;
  }
  return `Notion: ${error.message}`;
}
