/**
 * Shapes for the Creator Buddy management screens.
 *
 * Client-safe: the CMS renders tables and forms straight from the live Notion
 * schema, so a field added in Notion shows up here without a code change.
 */

export const NOTION_DB_KEYS = ["content", "channels", "sponsors", "tasks"] as const;
export type NotionDbKey = (typeof NOTION_DB_KEYS)[number];

export const NOTION_DB_LABELS: Record<NotionDbKey, string> = {
  content: "Content",
  channels: "Kanäle",
  sponsors: "Sponsoren",
  tasks: "Aufgaben",
};

/** Property types the CMS can edit. Everything else is shown read-only. */
export const EDITABLE_NOTION_TYPES = [
  "title",
  "rich_text",
  "select",
  "status",
  "multi_select",
  "date",
  "url",
  "email",
  "phone_number",
  "checkbox",
  "number",
  "relation",
] as const;

export type NotionFieldType = (typeof EDITABLE_NOTION_TYPES)[number] | "readonly";

export type NotionOption = { value: string; label: string };

export type NotionField = {
  /** The property name exactly as Notion spells it — also the payload key. */
  name: string;
  type: NotionFieldType;
  /** The raw Notion type, kept for read-only rendering hints. */
  notionType: string;
  options: NotionOption[];
  /** True for the database's title property, which Notion always requires. */
  isTitle: boolean;
};

/** One row, reduced to plain values the form components can bind to. */
export type NotionRowValue =
  | string
  | number
  | boolean
  | string[]
  | null;

export type NotionRow = {
  id: string;
  url: string | null;
  lastEdited: string | null;
  values: Record<string, NotionRowValue>;
};

export type NotionTable = {
  key: NotionDbKey;
  databaseId: string;
  title: string;
  fields: NotionField[];
  rows: NotionRow[];
};
