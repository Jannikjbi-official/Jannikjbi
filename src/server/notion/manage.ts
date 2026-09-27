import "server-only";

import {
  EDITABLE_NOTION_TYPES,
  type NotionDbKey,
  type NotionField,
  type NotionFieldType,
  type NotionOption,
  type NotionRow,
  type NotionRowValue,
  type NotionTable,
} from "@/lib/notion-manage-types";

import {
  NotionError,
  archivePage,
  createPage,
  queryDatabase,
  retrieveDatabase,
  updatePage,
  type NotionPage,
  type NotionPropertySchema,
  type NotionPropertyValue,
} from "./client";
import { getNotionConfig } from "./sync";

/**
 * Generic read/write layer over the Creator Buddy databases.
 *
 * Deliberately schema-driven rather than hard-coded per database: the CMS reads
 * the live Notion schema and renders whatever is there. A property added or
 * renamed in Notion therefore appears in the CMS without a code change, and the
 * four databases share one implementation.
 */

const EDITABLE = new Set<string>(EDITABLE_NOTION_TYPES);

export async function resolveDatabaseId(key: NotionDbKey): Promise<string> {
  const config = await getNotionConfig();

  const id =
    key === "content"
      ? config.contentDbId
      : key === "channels"
        ? config.channelsDbId
        : key === "sponsors"
          ? config.sponsorsDbId
          : config.tasksDbId;

  if (!id) {
    throw new NotionError(400, "not_configured", "Für diesen Bereich ist keine Datenbank-ID hinterlegt.");
  }

  return id;
}

/* -------------------------------------------------------------------------- */
/* Schema                                                                     */
/* -------------------------------------------------------------------------- */

function toField(name: string, schema: NotionPropertySchema): NotionField {
  const notionType = schema.type ?? "unknown";
  const type: NotionFieldType = EDITABLE.has(notionType)
    ? (notionType as NotionFieldType)
    : "readonly";

  const rawOptions =
    schema.select?.options ?? schema.status?.options ?? schema.multi_select?.options ?? [];

  return {
    name,
    type,
    notionType,
    options: rawOptions.map((option) => ({ value: option.name, label: option.name })),
    isTitle: notionType === "title",
  };
}

/**
 * Relation fields need the titles of the related pages to be usable, so the
 * related database is loaded once and its titles offered as options.
 */
async function loadRelationOptions(
  fields: NotionField[],
  properties: Record<string, NotionPropertySchema>,
): Promise<void> {
  await Promise.all(
    fields
      .filter((field) => field.type === "relation")
      .map(async (field) => {
        const relatedId = properties[field.name]?.relation?.database_id;
        if (!relatedId) return;

        try {
          const pages = await queryDatabase(relatedId);
          field.options = pages
            .map((page): NotionOption | null => {
              const title = titleOf(page);
              return title ? { value: page.id.replace(/-/g, ""), label: title } : null;
            })
            .filter((option): option is NotionOption => option !== null)
            .sort((a, b) => a.label.localeCompare(b.label, "de"));
        } catch (error) {
          // A relation the integration cannot read stays editable-but-empty
          // rather than breaking the whole table.
          console.error(`[notion] relation options for "${field.name}" failed:`, error);
          field.options = [];
        }
      }),
  );
}

function titleOf(page: NotionPage): string {
  for (const value of Object.values(page.properties)) {
    if (value?.type === "title") {
      return (value.title ?? []).map((part) => part.plain_text ?? "").join("").trim();
    }
  }
  return "";
}

/* -------------------------------------------------------------------------- */
/* Reading                                                                    */
/* -------------------------------------------------------------------------- */

function readValue(value: NotionPropertyValue | undefined): NotionRowValue {
  if (!value) return null;

  switch (value.type) {
    case "title":
      return (value.title ?? []).map((part) => part.plain_text ?? "").join("");
    case "rich_text":
      return (value.rich_text ?? []).map((part) => part.plain_text ?? "").join("");
    case "select":
    case "status":
      return value.select?.name ?? "";
    case "multi_select":
      return (value.multi_select ?? []).map((option) => option.name ?? "").filter(Boolean);
    case "date":
      return value.date?.start ?? "";
    case "url":
      return value.url ?? "";
    case "checkbox":
      return value.checkbox === true;
    case "number":
      return typeof value.number === "number" ? value.number : "";
    case "relation":
      return (value.relation ?? []).map((item) => item.id.replace(/-/g, ""));
    default:
      return null;
  }
}

export async function loadTable(key: NotionDbKey): Promise<NotionTable> {
  const databaseId = await resolveDatabaseId(key);
  const database = await retrieveDatabase(databaseId);

  // Notion returns properties unordered; put the title first, then the rest
  // alphabetically, so the table is stable between loads.
  const fields = Object.entries(database.properties)
    .map(([name, schema]) => toField(name, schema))
    .filter((field) => field.name.trim() !== "")
    .sort((a, b) => {
      if (a.isTitle !== b.isTitle) return a.isTitle ? -1 : 1;
      return a.name.localeCompare(b.name, "de");
    });

  await loadRelationOptions(fields, database.properties);

  const pages = await queryDatabase(databaseId);

  const rows: NotionRow[] = pages.map((page) => ({
    id: page.id.replace(/-/g, ""),
    url: page.url ?? null,
    lastEdited: page.last_edited_time ?? null,
    values: Object.fromEntries(
      fields.map((field) => [field.name, readValue(page.properties[field.name])]),
    ),
  }));

  return { key, databaseId, title: database.title, fields, rows };
}

/* -------------------------------------------------------------------------- */
/* Writing                                                                    */
/* -------------------------------------------------------------------------- */

const text = (value: unknown): string => (typeof value === "string" ? value : "");
const list = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

/**
 * Turns plain form values into a Notion properties payload.
 *
 * Only fields present in `values` are written, so a partial update leaves every
 * other property untouched. Read-only property types are skipped entirely —
 * Notion rejects writes to formulas and rollups.
 */
export function buildProperties(
  fields: NotionField[],
  values: Record<string, unknown>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  for (const field of fields) {
    if (field.type === "readonly") continue;
    if (!(field.name in values)) continue;

    const value = values[field.name];

    switch (field.type) {
      case "title":
        payload[field.name] = { title: [{ text: { content: text(value).slice(0, 2000) } }] };
        break;

      case "rich_text":
        payload[field.name] = {
          rich_text: text(value) ? [{ text: { content: text(value).slice(0, 2000) } }] : [],
        };
        break;

      case "select":
        payload[field.name] = { select: text(value) ? { name: text(value) } : null };
        break;

      case "status":
        // Notion rejects a null status, so an empty value leaves it untouched.
        if (text(value)) payload[field.name] = { status: { name: text(value) } };
        break;

      case "multi_select":
        payload[field.name] = { multi_select: list(value).map((name) => ({ name })) };
        break;

      case "date":
        payload[field.name] = { date: text(value) ? { start: text(value) } : null };
        break;

      case "url":
        payload[field.name] = { url: text(value) || null };
        break;

      case "email":
        payload[field.name] = { email: text(value) || null };
        break;

      case "phone_number":
        payload[field.name] = { phone_number: text(value) || null };
        break;

      case "checkbox":
        payload[field.name] = { checkbox: value === true };
        break;

      case "number": {
        const parsed = typeof value === "number" ? value : Number.parseFloat(text(value));
        payload[field.name] = { number: Number.isFinite(parsed) ? parsed : null };
        break;
      }

      case "relation":
        payload[field.name] = { relation: list(value).map((id) => ({ id })) };
        break;
    }
  }

  return payload;
}

export async function createRow(
  key: NotionDbKey,
  values: Record<string, unknown>,
): Promise<string> {
  const table = await loadTable(key);
  const page = await createPage(table.databaseId, buildProperties(table.fields, values));
  return page.id.replace(/-/g, "");
}

export async function updateRow(
  key: NotionDbKey,
  pageId: string,
  values: Record<string, unknown>,
): Promise<void> {
  const table = await loadTable(key);
  await updatePage(pageId, buildProperties(table.fields, values));
}

export async function archiveRow(pageId: string): Promise<void> {
  await archivePage(pageId);
}
