/**
 * Shared domain constants and labels.
 *
 * Deliberately free of any server-only import (no Mongoose, no `server-only`)
 * so client components can use the same labels and enums the models validate
 * against, without dragging the database driver into the browser bundle.
 *
 * Shared primitives for every content model.
 *
 * `image` is deliberately an embedded object rather than a bare URL string:
 * it already carries the alt text needed for accessibility, and a future media
 * library can add an `assetId` here without a migration of every document.
 */
export type StoredImage = {
  url: string;
  alt?: string;
};

export const GAME_STATUSES = ["aktuell", "geplant", "pausiert", "beendet"] as const;
export type GameStatus = (typeof GAME_STATUSES)[number];

export const GAME_STATUS_LABELS: Record<GameStatus, string> = {
  aktuell: "Aktuell",
  geplant: "Geplant",
  pausiert: "Pausiert",
  beendet: "Beendet",
};

export const PROJECT_STATUSES = ["live", "wip", "konzept", "pausiert", "archiviert"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  live: "Live",
  wip: "In Arbeit",
  konzept: "Konzept",
  pausiert: "Pausiert",
  archiviert: "Archiviert",
};

/** Platforms a stream can run on. Used for the schedule and its icons. */
export const STREAM_PLATFORMS = ["twitch", "youtube", "kick", "trovo", "andere"] as const;
export type StreamPlatform = (typeof STREAM_PLATFORMS)[number];

export const STREAM_PLATFORM_LABELS: Record<StreamPlatform, string> = {
  twitch: "Twitch",
  youtube: "YouTube",
  kick: "Kick",
  trovo: "Trovo",
  andere: "Andere",
};

/**
 * Social platforms the site knows an official brand icon for.
 * Adding one here plus an icon mapping is all a new network needs.
 */
export const SOCIAL_PLATFORMS = [
  "twitch",
  "youtube",
  "discord",
  "kick",
  "trovo",
  "kofi",
  "steam",
  "tiktok",
  "instagram",
  "facebook",
  "x",
  "bluesky",
  "threads",
  "website",
] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const SOCIAL_PLATFORM_LABELS: Record<SocialPlatform, string> = {
  twitch: "Twitch",
  youtube: "YouTube",
  discord: "Discord",
  kick: "Kick",
  trovo: "Trovo",
  kofi: "Ko-fi",
  steam: "Steam",
  tiktok: "TikTok",
  instagram: "Instagram",
  facebook: "Facebook",
  x: "X",
  bluesky: "Bluesky",
  threads: "Threads",
  website: "Website",
};

/** Sort options offered on /games. */
export const GAME_SORTS = ["standard", "name", "neueste", "release"] as const;
export type GameSort = (typeof GAME_SORTS)[number];

export const GAME_SORT_LABELS: Record<GameSort, string> = {
  standard: "Empfohlen",
  name: "Name (A–Z)",
  neueste: "Zuletzt hinzugefügt",
  release: "Release (neueste zuerst)",
};
