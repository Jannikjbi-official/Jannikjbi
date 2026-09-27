import "server-only";

import type {
  GameDTO,
  GenreDTO,
  ImageDTO,
  PartnerDTO,
  ProjectDTO,
  SiteSettingsDTO,
  SocialLinkDTO,
  StreamDTO,
} from "@/lib/types";
import { SITE_DEFAULTS } from "@/lib/site";
import type { NotionSyncMode } from "@/lib/notion-constants";
import type {
  GameStatus,
  ProjectStatus,
  SocialPlatform,
  StreamPlatform,
} from "@/server/models/types";

/* Mongoose lean documents are loosely typed; these helpers narrow them into
 * the strict DTOs the UI consumes, with every optional value normalised to
 * `null` so components never have to check for `undefined` as well. */

type Lean = Record<string, unknown>;

const id = (value: unknown): string => String(value ?? "");
const str = (value: unknown): string => (typeof value === "string" ? value : "");
const nullableStr = (value: unknown): string | null => {
  const text = typeof value === "string" ? value.trim() : "";
  return text === "" ? null : text;
};
const bool = (value: unknown, fallback = false): boolean =>
  typeof value === "boolean" ? value : fallback;
const num = (value: unknown, fallback = 0): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;
const iso = (value: unknown): string =>
  value instanceof Date ? value.toISOString() : new Date().toISOString();
const nullableIso = (value: unknown): string | null =>
  value instanceof Date ? value.toISOString() : null;
const strArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];

function image(value: unknown): ImageDTO | null {
  if (!value || typeof value !== "object") return null;
  const url = nullableStr((value as Lean).url);
  if (!url) return null;
  return { url, alt: nullableStr((value as Lean).alt) };
}

export function toGenreDTO(doc: Lean): GenreDTO {
  return {
    id: id(doc._id),
    name: str(doc.name),
    slug: str(doc.slug),
    description: nullableStr(doc.description),
    icon: nullableStr(doc.icon),
    color: nullableStr(doc.color),
    active: bool(doc.active, true),
    sortOrder: num(doc.sortOrder),
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  };
}

export function toGameDTO(doc: Lean): GameDTO {
  const genres = Array.isArray(doc.genres)
    ? doc.genres
        // Unpopulated entries are still raw ObjectIds; skip those instead of
        // rendering an empty chip.
        .filter((g): g is Lean => Boolean(g) && typeof g === "object" && "name" in (g as Lean))
        .map(toGenreDTO)
    : [];

  return {
    id: id(doc._id),
    name: str(doc.name),
    slug: str(doc.slug),
    description: str(doc.description),
    tagline: nullableStr(doc.tagline),
    image: image(doc.image),
    genres,
    status: (str(doc.status) || "aktuell") as GameStatus,
    active: bool(doc.active, true),
    featured: bool(doc.featured),
    platform: strArray(doc.platform),
    releaseDate: nullableIso(doc.releaseDate),
    steamUrl: nullableStr(doc.steamUrl),
    websiteUrl: nullableStr(doc.websiteUrl),
    twitchUrl: nullableStr(doc.twitchUrl),
    youtubeUrl: nullableStr(doc.youtubeUrl),
    sortOrder: num(doc.sortOrder),
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  };
}

export function toStreamDTO(doc: Lean): StreamDTO {
  const game =
    doc.game && typeof doc.game === "object" && "name" in (doc.game as Lean)
      ? {
          id: id((doc.game as Lean)._id),
          name: str((doc.game as Lean).name),
          slug: str((doc.game as Lean).slug),
        }
      : null;

  return {
    id: id(doc._id),
    date: iso(doc.date),
    startTime: str(doc.startTime),
    endTime: nullableStr(doc.endTime),
    game,
    title: str(doc.title),
    description: nullableStr(doc.description),
    platform: (str(doc.platform) || "twitch") as StreamPlatform,
    link: nullableStr(doc.link),
    active: bool(doc.active, true),
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  };
}

export function toProjectDTO(doc: Lean): ProjectDTO {
  return {
    id: id(doc._id),
    name: str(doc.name),
    slug: str(doc.slug),
    description: str(doc.description),
    tagline: nullableStr(doc.tagline),
    image: image(doc.image),
    category: nullableStr(doc.category),
    url: nullableStr(doc.url),
    status: (str(doc.status) || "live") as ProjectStatus,
    active: bool(doc.active, true),
    featured: bool(doc.featured),
    sortOrder: num(doc.sortOrder),
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  };
}

export function toSocialLinkDTO(doc: Lean): SocialLinkDTO {
  return {
    id: id(doc._id),
    platform: (str(doc.platform) || "website") as SocialPlatform,
    label: nullableStr(doc.label),
    handle: nullableStr(doc.handle),
    url: str(doc.url),
    description: nullableStr(doc.description),
    active: bool(doc.active, true),
    sortOrder: num(doc.sortOrder),
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  };
}

export function toPartnerDTO(doc: Lean): PartnerDTO {
  const integration = str(doc.integration);

  return {
    id: id(doc._id),
    name: str(doc.name),
    slug: str(doc.slug),
    description: nullableStr(doc.description),
    url: nullableStr(doc.url),
    image: image(doc.image),
    integration: integration === "instant-gaming" ? "instant-gaming" : "link",
    affiliateId: nullableStr(doc.affiliateId),
    disclosure: nullableStr(doc.disclosure),
    featured: bool(doc.featured),
    active: bool(doc.active, true),
    sortOrder: num(doc.sortOrder),
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  };
}

export function toSiteSettingsDTO(doc: Lean | null): SiteSettingsDTO {
  const seo = (doc?.seo ?? {}) as Lean;
  const contact = (doc?.contact ?? {}) as Lean;
  const sections = (doc?.sections ?? {}) as Lean;
  const notion = (doc?.notion ?? {}) as Lean;
  const notionModes = (notion.modes ?? {}) as Lean;

  const syncMode = (value: unknown): NotionSyncMode =>
    value === "pull" || value === "push" ? value : "off";

  return {
    creatorName: nullableStr(doc?.creatorName) ?? SITE_DEFAULTS.creatorName,
    siteTitle: nullableStr(doc?.siteTitle) ?? SITE_DEFAULTS.siteTitle,
    tagline: nullableStr(doc?.tagline) ?? SITE_DEFAULTS.tagline,
    description: nullableStr(doc?.description) ?? SITE_DEFAULTS.description,
    aboutHeadline: nullableStr(doc?.aboutHeadline) ?? SITE_DEFAULTS.aboutHeadline,
    aboutText: nullableStr(doc?.aboutText) ?? SITE_DEFAULTS.aboutText,
    heroHeadline: nullableStr(doc?.heroHeadline) ?? SITE_DEFAULTS.heroHeadline,
    heroSubline: nullableStr(doc?.heroSubline) ?? SITE_DEFAULTS.heroSubline,
    heroText: nullableStr(doc?.heroText) ?? SITE_DEFAULTS.heroText,
    footerText: nullableStr(doc?.footerText) ?? SITE_DEFAULTS.footerText,
    seo: {
      metaTitle: nullableStr(seo.metaTitle),
      metaDescription: nullableStr(seo.metaDescription),
      canonicalUrl: nullableStr(seo.canonicalUrl),
      ogImage: nullableStr(seo.ogImage),
      keywords: strArray(seo.keywords),
    },
    contact: {
      email: nullableStr(contact.email),
      businessEmail: nullableStr(contact.businessEmail),
      note: nullableStr(contact.note),
    },
    accentColor: nullableStr(doc?.accentColor) ?? SITE_DEFAULTS.accentColor,
    twitchLogin: nullableStr(doc?.twitchLogin) ?? (process.env.TWITCH_LOGIN || null),
    sections: {
      games: bool(sections.games, true),
      stream: bool(sections.stream, true),
      projects: bool(sections.projects, true),
      socials: bool(sections.socials, true),
      partners: bool(sections.partners, true),
    },
    notion: {
      contentDbId: nullableStr(notion.contentDbId) ?? process.env.NOTION_CONTENT_DB_ID ?? null,
      channelsDbId: nullableStr(notion.channelsDbId) ?? process.env.NOTION_CHANNELS_DB_ID ?? null,
      sponsorsDbId: nullableStr(notion.sponsorsDbId) ?? process.env.NOTION_SPONSORS_DB_ID ?? null,
      tasksDbId: nullableStr(notion.tasksDbId) ?? process.env.NOTION_TASKS_DB_ID ?? null,
      modes: {
        channels: syncMode(notionModes.channels),
        streams: syncMode(notionModes.streams),
        sponsors: syncMode(notionModes.sponsors),
      },
      lastSyncAt: nullableIso(notion.lastSyncAt),
      lastSyncOk: typeof notion.lastSyncOk === "boolean" ? notion.lastSyncOk : null,
    },
  };
}
