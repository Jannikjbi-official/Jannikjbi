/**
 * Mapping constants for the "Creator Buddy Dashboard" Notion workspace.
 *
 * Client-safe: no server-only imports, so the CMS UI can render the same
 * labels the sync uses.
 *
 * The Creator Buddy databases this integration understands:
 *   - "Content DB"  – every content item; `Typ = "Stream"` feeds the streamplan
 *   - "Kanäle"      – the channels, which feed the social links
 *   - "Sponsoren"   – sponsors, which feed the partners
 */

import type { SocialPlatform, StreamPlatform } from "./content-constants";

export const NOTION_RESOURCES = ["channels", "streams", "sponsors"] as const;
export type NotionResource = (typeof NOTION_RESOURCES)[number];

export const NOTION_RESOURCE_LABELS: Record<NotionResource, string> = {
  channels: "Kanäle → Social Links",
  streams: "Content DB (Typ: Stream) → Streamplan",
  sponsors: "Sponsoren → Partner",
};

/**
 * Direction per resource.
 *  - "off"  : nothing is synced
 *  - "pull" : Notion is the source of truth, the website mirrors it
 *  - "push" : the website is the source of truth, changes are written to Notion
 */
export const NOTION_SYNC_MODES = ["off", "pull", "push"] as const;
export type NotionSyncMode = (typeof NOTION_SYNC_MODES)[number];

export const NOTION_SYNC_MODE_LABELS: Record<NotionSyncMode, string> = {
  off: "Aus",
  pull: "Notion → Website",
  push: "Website → Notion",
};

/** Creator Buddy "Kanäle → Plattform" select options. */
export const NOTION_CHANNEL_PLATFORMS = [
  "Website",
  "Newsletter",
  "X (Twitter)",
  "Kick",
  "Facebook",
  "TikTok",
  "Instagram",
  "YouTube",
  "Twitch",
] as const;

/** Creator Buddy channel platform -> the site's social platform. */
export const NOTION_PLATFORM_TO_SOCIAL: Record<string, SocialPlatform> = {
  Website: "website",
  Newsletter: "website",
  "X (Twitter)": "x",
  Kick: "kick",
  Facebook: "facebook",
  TikTok: "tiktok",
  Instagram: "instagram",
  YouTube: "youtube",
  Twitch: "twitch",
};

/** Creator Buddy channel platform -> the site's stream platform. */
export const NOTION_PLATFORM_TO_STREAM: Record<string, StreamPlatform> = {
  Twitch: "twitch",
  YouTube: "youtube",
  Kick: "kick",
};

/** The site's stream platform -> the Creator Buddy channel platform (for push). */
export const STREAM_TO_NOTION_PLATFORM: Partial<Record<StreamPlatform, string>> = {
  twitch: "Twitch",
  youtube: "YouTube",
  kick: "Kick",
};

/** Creator Buddy "Content DB → Typ" select options. */
export const NOTION_CONTENT_TYPES = [
  "Video",
  "Short",
  "Stream",
  "Foto",
  "Post",
  "Podcast",
] as const;

/** Creator Buddy "Content DB → Status" select options, in workflow order. */
export const NOTION_CONTENT_STATUSES = [
  "Geplant",
  "Recherche",
  "Skript",
  "Skript Review",
  "Fertig zum Aufnehmen",
  "In Bearbeitung",
  "Fertig zum Freischalten",
  "Abgeschlossen",
  "Nachbereitung",
  "In Wartestellung",
] as const;

/**
 * Statuses that keep a stream off the public schedule even when it has a date.
 * "In Wartestellung" means the plan is on hold, so publishing it would be a
 * promise the schedule cannot keep.
 */
export const NOTION_STATUSES_NOT_PUBLIC = new Set<string>(["In Wartestellung"]);

/** Status written to Notion when the website pushes a new stream. */
export const NOTION_DEFAULT_PUSH_STATUS = "Geplant";

/** Notion REST API version this integration is written against. */
export const NOTION_API_VERSION = "2022-06-28";
