import { z } from "zod";

import { NOTION_SYNC_MODES } from "@/lib/notion-constants";
import {
  GAME_STATUSES,
  PROJECT_STATUSES,
  SOCIAL_PLATFORMS,
  STREAM_PLATFORMS,
} from "@/lib/content-constants";
import {
  emptyToUndefined,
  hexColorSchema,
  objectIdSchema,
  optionalImage,
  optionalUrl,
  slugSchema,
  sortOrderSchema,
} from "./common";

/* -------------------------------------------------------------------------- */
/* Genre                                                                      */
/* -------------------------------------------------------------------------- */

export const genreInputSchema = z.object({
  name: z.string().trim().min(1, "Name ist erforderlich.").max(60),
  slug: slugSchema,
  description: emptyToUndefined(z.string().trim().max(400)),
  icon: emptyToUndefined(z.string().trim().max(60)),
  color: emptyToUndefined(hexColorSchema),
  active: z.coerce.boolean().default(true),
  sortOrder: sortOrderSchema,
});

export type GenreInput = z.infer<typeof genreInputSchema>;

/* -------------------------------------------------------------------------- */
/* Game                                                                       */
/* -------------------------------------------------------------------------- */

export const gameInputSchema = z.object({
  name: z.string().trim().min(1, "Name ist erforderlich.").max(120),
  slug: slugSchema,
  description: z.string().trim().min(1, "Beschreibung ist erforderlich.").max(4000),
  tagline: emptyToUndefined(z.string().trim().max(180)),
  image: optionalImage,
  genres: z.array(objectIdSchema).max(20).default([]),
  status: z.enum(GAME_STATUSES).default("aktuell"),
  active: z.coerce.boolean().default(true),
  featured: z.coerce.boolean().default(false),
  platform: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  releaseDate: emptyToUndefined(z.coerce.date()),
  steamUrl: optionalUrl,
  websiteUrl: optionalUrl,
  twitchUrl: optionalUrl,
  youtubeUrl: optionalUrl,
  sortOrder: sortOrderSchema,
});

export type GameInput = z.infer<typeof gameInputSchema>;

/* -------------------------------------------------------------------------- */
/* Stream                                                                     */
/* -------------------------------------------------------------------------- */

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Bitte eine Uhrzeit als HH:MM angeben.");

/** Object form, so PATCH handlers can call `.partial()` on it. */
export const streamBaseSchema = z.object({
  date: z.coerce.date({ message: "Bitte ein gültiges Datum angeben." }),
  startTime: timeSchema,
  endTime: emptyToUndefined(timeSchema),
  game: emptyToUndefined(objectIdSchema),
  title: z.string().trim().min(1, "Titel ist erforderlich.").max(160),
  description: emptyToUndefined(z.string().trim().max(2000)),
  platform: z.enum(STREAM_PLATFORMS).default("twitch"),
  link: optionalUrl,
  active: z.coerce.boolean().default(true),
});

const endAfterStart = (value: { startTime?: string; endTime?: string }) =>
  !value.endTime || !value.startTime || value.endTime > value.startTime;

export const streamInputSchema = streamBaseSchema.refine(endAfterStart, {
  message: "Das Ende muss nach dem Start liegen.",
  path: ["endTime"],
});

export const streamPatchSchema = streamBaseSchema.partial().refine(endAfterStart, {
  message: "Das Ende muss nach dem Start liegen.",
  path: ["endTime"],
});

export type StreamInput = z.infer<typeof streamInputSchema>;

/* -------------------------------------------------------------------------- */
/* Project                                                                    */
/* -------------------------------------------------------------------------- */

export const projectInputSchema = z.object({
  name: z.string().trim().min(1, "Name ist erforderlich.").max(120),
  slug: slugSchema,
  description: z.string().trim().min(1, "Beschreibung ist erforderlich.").max(4000),
  tagline: emptyToUndefined(z.string().trim().max(180)),
  image: optionalImage,
  category: emptyToUndefined(z.string().trim().max(60)),
  url: optionalUrl,
  status: z.enum(PROJECT_STATUSES).default("live"),
  active: z.coerce.boolean().default(true),
  featured: z.coerce.boolean().default(false),
  sortOrder: sortOrderSchema,
});

export type ProjectInput = z.infer<typeof projectInputSchema>;

/* -------------------------------------------------------------------------- */
/* Social link                                                                */
/* -------------------------------------------------------------------------- */

export const socialLinkInputSchema = z.object({
  platform: z.enum(SOCIAL_PLATFORMS),
  label: emptyToUndefined(z.string().trim().max(60)),
  handle: emptyToUndefined(z.string().trim().max(80)),
  url: z
    .string()
    .trim()
    .min(1, "URL ist erforderlich.")
    .refine(
      (value) => {
        try {
          const url = new URL(value);
          return url.protocol === "https:" || url.protocol === "http:";
        } catch {
          return false;
        }
      },
      { message: "Bitte eine gültige http(s)-URL angeben." },
    ),
  description: emptyToUndefined(z.string().trim().max(200)),
  active: z.coerce.boolean().default(true),
  sortOrder: sortOrderSchema,
});

export type SocialLinkInput = z.infer<typeof socialLinkInputSchema>;

/* -------------------------------------------------------------------------- */
/* Partner                                                                    */
/* -------------------------------------------------------------------------- */

export const partnerInputSchema = z.object({
  name: z.string().trim().min(1, "Name ist erforderlich.").max(120),
  slug: slugSchema,
  description: emptyToUndefined(z.string().trim().max(2000)),
  url: optionalUrl,
  image: optionalImage,
  integration: z.enum(["link", "instant-gaming"]).default("link"),
  affiliateId: emptyToUndefined(z.string().trim().max(80)),
  disclosure: emptyToUndefined(z.string().trim().max(400)),
  featured: z.coerce.boolean().default(false),
  active: z.coerce.boolean().default(true),
  sortOrder: sortOrderSchema,
});

export type PartnerInput = z.infer<typeof partnerInputSchema>;

/* -------------------------------------------------------------------------- */
/* Site settings                                                              */
/* -------------------------------------------------------------------------- */

export const siteSettingsInputSchema = z.object({
  creatorName: emptyToUndefined(z.string().trim().max(80)),
  siteTitle: emptyToUndefined(z.string().trim().max(120)),
  tagline: emptyToUndefined(z.string().trim().max(160)),
  description: emptyToUndefined(z.string().trim().max(400)),

  aboutHeadline: emptyToUndefined(z.string().trim().max(160)),
  aboutText: emptyToUndefined(z.string().trim().max(8000)),

  heroHeadline: emptyToUndefined(z.string().trim().max(160)),
  heroSubline: emptyToUndefined(z.string().trim().max(200)),
  heroText: emptyToUndefined(z.string().trim().max(1200)),

  footerText: emptyToUndefined(z.string().trim().max(400)),

  seo: z
    .object({
      metaTitle: emptyToUndefined(z.string().trim().max(160)),
      metaDescription: emptyToUndefined(z.string().trim().max(400)),
      canonicalUrl: optionalUrl,
      ogImage: optionalUrl,
      keywords: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
    })
    .default({ keywords: [] }),

  contact: z
    .object({
      email: emptyToUndefined(z.email("Bitte eine gültige E-Mail-Adresse angeben.")),
      businessEmail: emptyToUndefined(z.email("Bitte eine gültige E-Mail-Adresse angeben.")),
      note: emptyToUndefined(z.string().trim().max(400)),
    })
    .default({}),

  accentColor: hexColorSchema.default("#ffc61a"),
  twitchLogin: emptyToUndefined(z.string().trim().max(60)),

  notion: z
    .object({
      contentDbId: emptyToUndefined(z.string().trim().max(120)),
      channelsDbId: emptyToUndefined(z.string().trim().max(120)),
      sponsorsDbId: emptyToUndefined(z.string().trim().max(120)),
      tasksDbId: emptyToUndefined(z.string().trim().max(120)),
      modes: z
        .object({
          channels: z.enum(NOTION_SYNC_MODES).default("off"),
          streams: z.enum(NOTION_SYNC_MODES).default("off"),
          sponsors: z.enum(NOTION_SYNC_MODES).default("off"),
        })
        .default({ channels: "off", streams: "off", sponsors: "off" }),
    })
    .default({ modes: { channels: "off", streams: "off", sponsors: "off" } }),

  sections: z
    .object({
      games: z.coerce.boolean().default(true),
      stream: z.coerce.boolean().default(true),
      projects: z.coerce.boolean().default(true),
      socials: z.coerce.boolean().default(true),
      partners: z.coerce.boolean().default(true),
    })
    .default({ games: true, stream: true, projects: true, socials: true, partners: true }),
});

export type SiteSettingsInput = z.infer<typeof siteSettingsInputSchema>;
