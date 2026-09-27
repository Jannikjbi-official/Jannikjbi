import {
  NOTION_PLATFORM_TO_SOCIAL,
  NOTION_PLATFORM_TO_STREAM,
  NOTION_STATUSES_NOT_PUBLIC,
} from "@/lib/notion-constants";
import type { SocialPlatform, StreamPlatform } from "@/lib/content-constants";
import { slugify } from "@/lib/utils";

import type { NotionPage, NotionPropertyValue } from "./client";

/*
 * Pure mapping functions: no token, no database, no side effects. Kept free of
 * `server-only` so the mapping rules can be unit tested directly.
 */

/* -------------------------------------------------------------------------- */
/* Property readers                                                           */
/* -------------------------------------------------------------------------- */

const richText = (value?: NotionPropertyValue): string =>
  (value?.title ?? value?.rich_text ?? [])
    .map((part) => part.plain_text ?? "")
    .join("")
    .trim();

const url = (value?: NotionPropertyValue): string | null => {
  const raw = value?.url?.trim();
  if (!raw) return null;

  try {
    const parsed = new URL(raw);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : null;
  } catch {
    return null;
  }
};

const select = (value?: NotionPropertyValue): string | null =>
  value?.select?.name?.trim() || null;

const checkbox = (value?: NotionPropertyValue): boolean => value?.checkbox === true;

const relationIds = (value?: NotionPropertyValue): string[] =>
  (value?.relation ?? []).map((item) => item.id.replace(/-/g, ""));

const dateStart = (value?: NotionPropertyValue): string | null =>
  value?.date?.start?.trim() || null;

/* -------------------------------------------------------------------------- */
/* Kanäle -> social links                                                     */
/* -------------------------------------------------------------------------- */

export type MappedChannel = {
  notionId: string;
  platform: SocialPlatform;
  /** The Creator Buddy platform name, needed to resolve a stream's channel. */
  notionPlatform: string | null;
  label: string;
  handle: string | null;
  url: string;
};

/** A Kanäle row without a usable URL cannot become a link, so it is skipped. */
export function mapChannel(page: NotionPage): MappedChannel | null {
  const link = url(page.properties["URL"]);
  const name = richText(page.properties["Name"]);
  const notionPlatform = select(page.properties["Plattform"]);

  if (!link) return null;

  const platform = notionPlatform
    ? (NOTION_PLATFORM_TO_SOCIAL[notionPlatform] ?? "website")
    : "website";

  return {
    notionId: page.id.replace(/-/g, ""),
    platform,
    notionPlatform,
    label: name || notionPlatform || "Kanal",
    handle: handleFromUrl(link),
    url: link,
  };
}

/** "youtube.com/@Jannikjbi" -> "Jannikjbi"; returns null when there is none. */
function handleFromUrl(link: string): string | null {
  try {
    const { pathname } = new URL(link);
    const segment = pathname.split("/").filter(Boolean).at(-1);
    if (!segment) return null;

    const handle = decodeURIComponent(segment).replace(/^@/, "").trim();
    return handle && handle.length <= 80 ? handle : null;
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Content DB (Typ = Stream) -> streams                                       */
/* -------------------------------------------------------------------------- */

export type MappedStream = {
  notionId: string;
  title: string;
  date: Date;
  startTime: string;
  platform: StreamPlatform;
  link: string | null;
  description: string | null;
  active: boolean;
};

export type SkippedRow = { title: string; reason: string };

/**
 * Turns a Content DB row into a stream.
 *
 * Returns a skip reason instead of guessing whenever the row lacks what the
 * public schedule needs — no invented dates, no invented times.
 */
export function mapStream(
  page: NotionPage,
  channelPlatformById: Map<string, string | null>,
): { stream: MappedStream } | { skipped: SkippedRow } {
  const title = richText(page.properties["Name"]);
  const type = select(page.properties["Typ"]);
  const status = select(page.properties["Status"]);
  const isIdea = checkbox(page.properties["Idee"]);
  const published = dateStart(page.properties["Veröffentlichungsdatum"]);

  const label = title || "(ohne Titel)";

  if (type !== "Stream") {
    return { skipped: { title: label, reason: `Typ ist "${type ?? "leer"}", nicht "Stream"` } };
  }

  if (!title) {
    return { skipped: { title: label, reason: "Kein Name gesetzt" } };
  }

  if (!published) {
    return { skipped: { title: label, reason: "Kein Veröffentlichungsdatum gesetzt" } };
  }

  const parsed = new Date(published);
  if (Number.isNaN(parsed.getTime())) {
    return { skipped: { title: label, reason: "Veröffentlichungsdatum ist ungültig" } };
  }

  // A plain "2026-04-12" carries no time; Notion sends a datetime only when one
  // was entered. Default to 19:00 local, which the CMS can correct afterwards.
  const hasTime = published.length > 10;
  const startTime = hasTime
    ? new Intl.DateTimeFormat("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Europe/Berlin",
      }).format(parsed)
    : "19:00";

  const dayKey = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Europe/Berlin",
  }).format(parsed);

  const channelPlatform = relationIds(page.properties["Kanal"])
    .map((id) => channelPlatformById.get(id))
    .find((value): value is string => Boolean(value));

  const platform = channelPlatform
    ? (NOTION_PLATFORM_TO_STREAM[channelPlatform] ?? "andere")
    : "twitch";

  return {
    stream: {
      notionId: page.id.replace(/-/g, ""),
      title,
      date: new Date(`${dayKey}T00:00:00.000Z`),
      startTime,
      platform,
      link: url(page.properties["URL"]),
      description: null,
      // An idea is not a commitment, and a plan on hold is not a date to show.
      active: !isIdea && !NOTION_STATUSES_NOT_PUBLIC.has(status ?? ""),
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Sponsoren -> partners                                                      */
/* -------------------------------------------------------------------------- */

export type MappedSponsor = {
  notionId: string;
  name: string;
  slug: string;
};

/**
 * Sponsors carry no public copy in Creator Buddy, so the import only creates
 * the record. It stays deactivated until it is filled in and released in the
 * CMS — a business relationship never goes live by accident.
 */
export function mapSponsor(page: NotionPage): MappedSponsor | null {
  const name = richText(page.properties["Sponsor"]) || richText(page.properties["Name"]);
  if (!name) return null;

  const slug = slugify(name);
  if (!slug) return null;

  return { notionId: page.id.replace(/-/g, ""), name, slug };
}
