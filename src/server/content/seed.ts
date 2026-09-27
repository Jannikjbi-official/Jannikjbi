import "server-only";

import { Game, Genre, Partner, Project, SiteSettings, SocialLink } from "@/server/models";
import { SITE_DEFAULTS } from "@/lib/site";
import { slugify } from "@/lib/utils";

import { connectToDatabase } from "./db";

/**
 * Initial content so a fresh database renders a complete site.
 *
 * Idempotent by design: everything is upserted with `$setOnInsert`, keyed by
 * slug (or by URL for social links). Running it a second time changes nothing
 * and never overwrites an edit made in the CMS.
 *
 * Shared by the `npm run seed` CLI and the protected seed endpoint, so there is
 * only one copy of the content.
 */

const GENRES = [
  { name: "Simulation", sortOrder: 10, color: "#4ea8ff" },
  { name: "Aufbau", sortOrder: 20, color: "#ffc61a" },
  { name: "Management", sortOrder: 30, color: "#a78bfa" },
  { name: "Transport", sortOrder: 40, color: "#34d399" },
  { name: "Wirtschaft", sortOrder: 50, color: "#fb923c" },
  { name: "Strategie", sortOrder: 60, color: "#f472b6" },
  { name: "Tycoon", sortOrder: 70, color: "#facc15" },
  { name: "Sandbox", sortOrder: 80, color: "#60a5fa" },
  { name: "Open World", sortOrder: 90, color: "#2dd4bf" },
  { name: "Survival", sortOrder: 100, color: "#f87171" },
  { name: "RPG", sortOrder: 110, color: "#c084fc" },
] as const;

/** The channels from the brief. The Notion sync keeps them current later on. */
const SOCIALS = [
  { platform: "twitch", label: "Twitch", handle: "jannikjbi", url: "https://www.twitch.tv/jannikjbi", sortOrder: 10 },
  { platform: "youtube", label: "YouTube", handle: "Jannikjbi", url: "https://www.youtube.com/@Jannikjbi", sortOrder: 20 },
  { platform: "discord", label: "Discord", handle: "jannikjbi", url: "https://discord.gg/jannikjbi", sortOrder: 30 },
  { platform: "kick", label: "Kick", handle: "jannikjbi08", url: "https://kick.com/jannikjbi08", sortOrder: 40 },
  { platform: "trovo", label: "Trovo", handle: "jannikjbi", url: "https://trovo.live/s/jannikjbi", sortOrder: 50 },
  { platform: "kofi", label: "Ko-fi", handle: "jannikjbi", url: "https://ko-fi.com/jannikjbi", sortOrder: 60 },
] as const;

const GAMES = [
  {
    name: "Transport Fever 2",
    slug: "transport-fever-2",
    tagline: "Aufbau-Klassiker rund um Schiene, Straße, Wasser und Luft.",
    description:
      "Transport Fever 2 ist eine Transport-Simulation, in der ganze Verkehrsnetze von Grund auf entstehen. Von der ersten Buslinie bis zum durchgetakteten Güterkorridor geht es darum, Angebot, Nachfrage und Streckenführung sauber aufeinander abzustimmen.\n\nMich reizt daran vor allem das Planen: Wo entsteht ein Engpass, welche Linie lohnt sich wirklich, und wie sieht ein Netz aus, das auch in fünfzig Spieljahren noch trägt?",
    genreNames: ["Simulation", "Aufbau", "Transport", "Wirtschaft"],
    status: "aktuell",
    featured: true,
    platform: ["PC"],
    sortOrder: 10,
  },
  {
    name: "Transport Fever 3",
    slug: "transport-fever-3",
    tagline: "Der nächste Teil der Reihe – und definitiv auf meiner Liste.",
    description:
      "Der dritte Teil der Transport-Fever-Reihe. Sobald er bei mir läuft, wird er hier und im Streamplan auftauchen.",
    genreNames: ["Simulation", "Aufbau", "Transport"],
    status: "geplant",
    featured: false,
    platform: ["PC"],
    sortOrder: 20,
  },
] as const;

export type SeedReport = {
  genres: number;
  games: number;
  projects: number;
  socialLinks: number;
  partners: number;
  settings: boolean;
};

export async function seedContent(): Promise<SeedReport> {
  await connectToDatabase();

  // --- Genres ---------------------------------------------------------------
  const genreIds = new Map<string, string>();

  for (const genre of GENRES) {
    const slug = slugify(genre.name);
    const doc = await Genre.findOneAndUpdate(
      { slug },
      { $setOnInsert: { ...genre, slug, active: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();

    genreIds.set(genre.name, String(doc._id));
  }

  // --- Games ----------------------------------------------------------------
  for (const { genreNames, ...game } of GAMES) {
    await Game.findOneAndUpdate(
      { slug: game.slug },
      {
        $setOnInsert: {
          ...game,
          platform: [...game.platform],
          genres: genreNames.map((name) => genreIds.get(name)).filter(Boolean),
          active: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();
  }

  // --- Projects -------------------------------------------------------------
  await Project.findOneAndUpdate(
    { slug: "voltfm" },
    {
      $setOnInsert: {
        name: "VoltFM",
        slug: "voltfm",
        tagline: "Mein eigenes Webradio-Projekt.",
        description:
          "VoltFM ist mein eigenes Webradio-Projekt mit 24/7-Musik, Radio-Content und einer modernen digitalen Plattform.",
        category: "Webradio",
        url: "https://www.voltfm.xyz/",
        status: "live",
        active: true,
        featured: true,
        sortOrder: 10,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).exec();

  // --- Social links ---------------------------------------------------------
  for (const social of SOCIALS) {
    await SocialLink.findOneAndUpdate(
      { url: social.url },
      { $setOnInsert: { ...social, active: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();
  }

  // --- Partner --------------------------------------------------------------
  await Partner.findOneAndUpdate(
    { slug: "instant-gaming" },
    {
      $setOnInsert: {
        name: "Instant Gaming",
        slug: "instant-gaming",
        description:
          "Instant Gaming ist mein Partner für Spiele-Keys. Über die Links hier bekommst du Spiele oft günstiger als im Standard-Store.",
        url: "https://www.instant-gaming.com/?igr=Jannikjbi",
        integration: "instant-gaming",
        affiliateId: "Jannikjbi",
        disclosure:
          "Werbung / Affiliate: Wenn du über diese Links kaufst, erhalte ich eine Provision. Für dich ändert sich der Preis dadurch nicht.",
        active: true,
        featured: true,
        sortOrder: 10,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).exec();

  // --- Site settings --------------------------------------------------------
  await SiteSettings.findOneAndUpdate(
    { key: "default" },
    {
      $setOnInsert: {
        key: "default",
        creatorName: SITE_DEFAULTS.creatorName,
        siteTitle: SITE_DEFAULTS.siteTitle,
        tagline: SITE_DEFAULTS.tagline,
        description: SITE_DEFAULTS.description,
        heroHeadline: SITE_DEFAULTS.heroHeadline,
        heroSubline: SITE_DEFAULTS.heroSubline,
        heroText: SITE_DEFAULTS.heroText,
        aboutHeadline: SITE_DEFAULTS.aboutHeadline,
        aboutText: SITE_DEFAULTS.aboutText,
        footerText: SITE_DEFAULTS.footerText,
        accentColor: SITE_DEFAULTS.accentColor,
        twitchLogin: "jannikjbi",
        seo: {
          metaTitle: SITE_DEFAULTS.siteTitle,
          metaDescription: SITE_DEFAULTS.description,
          canonicalUrl: "https://jannikjbi.de",
          keywords: ["Jannikjbi", "Gaming", "Streaming", "Simulation", "Aufbauspiele"],
        },
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).exec();

  // Report the resulting state rather than "how many were inserted": on a
  // second run the counts stay the same, which is exactly the point.
  const [genres, games, projects, socialLinks, partners] = await Promise.all([
    Genre.countDocuments({}),
    Game.countDocuments({}),
    Project.countDocuments({}),
    SocialLink.countDocuments({}),
    Partner.countDocuments({}),
  ]);

  return { genres, games, projects, socialLinks, partners, settings: true };
}
