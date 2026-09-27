import { TIMEZONE } from "./site";

/** Tiny class-name joiner. */
export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

/**
 * URL-safe slug from arbitrary text, with German umlauts spelled out so
 * "Aufbau & Wirtschaft" becomes "aufbau-wirtschaft" rather than losing letters.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/ä/gi, "ae")
    .replace(/ö/gi, "oe")
    .replace(/ü/gi, "ue")
    .replace(/ß/g, "ss")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSlug(value: string): boolean {
  return value.length > 0 && value.length <= 80 && SLUG_PATTERN.test(value);
}

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: TIMEZONE,
});

const shortDateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: TIMEZONE,
});

const weekdayFormatter = new Intl.DateTimeFormat("de-DE", {
  weekday: "long",
  timeZone: TIMEZONE,
});

export function formatDate(value: Date | string): string {
  return dateFormatter.format(new Date(value));
}

export function formatShortDate(value: Date | string): string {
  return shortDateFormatter.format(new Date(value));
}

export function formatWeekday(value: Date | string): string {
  return weekdayFormatter.format(new Date(value));
}

/** "18:00" + optional "22:00" -> "18:00 – 22:00 Uhr" */
export function formatTimeRange(start: string, end?: string | null): string {
  return end ? `${start} – ${end} Uhr` : `ab ${start} Uhr`;
}

/** Year only — used when a game has a release date but the day adds no value. */
export function formatYear(value: Date | string): string {
  return String(new Date(value).getUTCFullYear());
}

/** Splits a textarea value into paragraphs on blank lines. */
export function toParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * Only http(s) URLs are ever rendered as links, so a stored value can never
 * become a `javascript:` or `data:` navigation target.
 */
export function safeExternalUrl(value: string | null | undefined): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Hostname without "www.", for displaying a link target compactly. */
export function displayHost(value: string): string | null {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}
