import "server-only";

import { NOTION_API_VERSION } from "@/lib/notion-constants";

/**
 * Minimal Notion REST client.
 *
 * Written against the official API rather than the SDK so the integration has
 * no extra runtime dependency and the exact requests stay visible. Only the
 * four calls this sync needs are implemented.
 */

const NOTION_BASE = "https://api.notion.com/v1";

export class NotionError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "NotionError";
    this.status = status;
    this.code = code;
  }
}

export function isNotionConfigured(): boolean {
  return Boolean(process.env.NOTION_TOKEN?.trim());
}

function token(): string {
  const value = process.env.NOTION_TOKEN?.trim();

  if (!value) {
    throw new NotionError(
      500,
      "not_configured",
      "NOTION_TOKEN ist nicht gesetzt.",
    );
  }

  return value;
}

async function request<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const response = await fetch(`${NOTION_BASE}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token()}`,
      "Notion-Version": NOTION_API_VERSION,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as
    | { code?: string; message?: string }
    | null;

  if (!response.ok) {
    throw new NotionError(
      response.status,
      payload?.code ?? "unknown_error",
      payload?.message ?? `Notion antwortete mit Status ${response.status}.`,
    );
  }

  return payload as T;
}

/* -------------------------------------------------------------------------- */
/* Shapes                                                                     */
/* -------------------------------------------------------------------------- */

export type NotionRichText = { plain_text?: string };

export type NotionPropertyValue = {
  type?: string;
  title?: NotionRichText[];
  rich_text?: NotionRichText[];
  url?: string | null;
  checkbox?: boolean;
  select?: { name?: string } | null;
  multi_select?: Array<{ name?: string }>;
  date?: { start?: string | null; end?: string | null } | null;
  relation?: Array<{ id: string }>;
  number?: number | null;
};

export type NotionPage = {
  id: string;
  archived?: boolean;
  in_trash?: boolean;
  last_edited_time?: string;
  url?: string;
  properties: Record<string, NotionPropertyValue>;
};

type QueryResponse = {
  results: NotionPage[];
  next_cursor: string | null;
  has_more: boolean;
};

/* -------------------------------------------------------------------------- */
/* Calls                                                                      */
/* -------------------------------------------------------------------------- */

/** A property definition as Notion reports it in the database schema. */
export type NotionPropertySchema = {
  id: string;
  name: string;
  type: string;
  select?: { options?: Array<{ name: string; color?: string }> };
  multi_select?: { options?: Array<{ name: string; color?: string }> };
  status?: { options?: Array<{ name: string; color?: string }> };
  relation?: { database_id?: string };
};

/** Reads a database's metadata and schema. */
export async function retrieveDatabase(databaseId: string): Promise<{
  id: string;
  title: string;
  properties: Record<string, NotionPropertySchema>;
}> {
  const data = await request<{
    id: string;
    title?: NotionRichText[];
    properties?: Record<string, NotionPropertySchema>;
  }>(`/databases/${normalizeId(databaseId)}`);

  return {
    id: data.id,
    title: data.title?.map((part) => part.plain_text ?? "").join("").trim() || "(ohne Titel)",
    properties: data.properties ?? {},
  };
}

/**
 * Archives a page. Notion has no hard delete through the API; archiving is what
 * the "Delete" action in the Notion UI does too, so the page stays restorable
 * from the trash.
 */
export async function archivePage(pageId: string): Promise<void> {
  await request(`/pages/${normalizeId(pageId)}`, {
    method: "PATCH",
    body: { archived: true },
  });
}

/** Reads every non-archived page of a database, following pagination. */
export async function queryDatabase(databaseId: string): Promise<NotionPage[]> {
  const id = normalizeId(databaseId);
  const pages: NotionPage[] = [];
  let cursor: string | null = null;

  // Bounded so a misconfigured database can never spin forever.
  for (let round = 0; round < 50; round += 1) {
    const data: QueryResponse = await request<QueryResponse>(
      `/databases/${id}/query`,
      {
        method: "POST",
        body: { page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) },
      },
    );

    pages.push(...data.results.filter((page) => !page.archived && !page.in_trash));

    if (!data.has_more || !data.next_cursor) break;
    cursor = data.next_cursor;
  }

  return pages;
}

export async function createPage(
  databaseId: string,
  properties: Record<string, unknown>,
): Promise<NotionPage> {
  return request<NotionPage>("/pages", {
    method: "POST",
    body: { parent: { database_id: normalizeId(databaseId) }, properties },
  });
}

export async function updatePage(
  pageId: string,
  properties: Record<string, unknown>,
): Promise<NotionPage> {
  return request<NotionPage>(`/pages/${normalizeId(pageId)}`, {
    method: "PATCH",
    body: { properties },
  });
}

/**
 * Accepts a raw id, a dashed id or a full Notion URL and returns the bare
 * 32-character id, so the CMS field can be filled by pasting a link.
 */
export function normalizeId(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/[0-9a-f]{32}/i) ?? trimmed.replace(/-/g, "").match(/[0-9a-f]{32}/i);

  if (match) return match[0];

  // Let Notion reject it and report its own error.
  return trimmed;
}

export function isValidNotionId(value: string): boolean {
  return /[0-9a-f]{32}/i.test(value.replace(/-/g, ""));
}
