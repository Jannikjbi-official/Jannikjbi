/**
 * Static site constants.
 *
 * Only things that are structural (routes, legal data, defaults) live here.
 * Everything editable — games, genres, streams, projects, socials, partners,
 * about text, SEO strings — comes from MongoDB.
 */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://jannikjbi.de"
).replace(/\/$/, "");

/** Fallbacks used until the CMS site settings are filled in. */
export const SITE_DEFAULTS = {
  creatorName: "Jannikjbi",
  siteTitle: "Jannikjbi – Gaming, Content & Projekte",
  tagline: "Gaming · Content · Streaming · Projekte",
  description:
    "Jannikjbi – Gaming, Streaming, Content und digitale Projekte. Entdecke meine Games, Streams, Projekte und Social-Media-Kanäle.",
  heroHeadline: "Hey, ich bin Jannikjbi.",
  heroSubline: "Gaming · Content · Streaming · Projekte",
  heroText:
    "Ich spiele, streame und baue eigene digitale Projekte. Der Schwerpunkt liegt auf Simulationen, Aufbau- und Managementspielen – daneben entsteht laufend Neues rund um Content und eigene Webseiten.",
  aboutHeadline: "Über mich",
  aboutText:
    "Ich bin Jannikjbi und beschäftige mich hauptsächlich mit Gaming, Streaming und digitalen Projekten. Besonders Simulationen, Aufbau- und Managementspiele gehören zu meinen bevorzugten Genres. Neben meinem Content arbeite ich an eigenen Projekten und entwickle meine Online-Präsenz kontinuierlich weiter.",
  footerText: "Gaming · Content · Projekte",
  accentColor: "#ffc61a",
} as const;

/** Public navigation. There is deliberately no login or admin entry here. */
export const MAIN_NAV = [
  { href: "/", label: "Start" },
  { href: "/games", label: "Games" },
  { href: "/content", label: "Content" },
  { href: "/projects", label: "Projekte" },
  { href: "/about", label: "Über mich" },
  { href: "/partners", label: "Partner" },
] as const;

export const LEGAL_NAV = [
  { href: "/impressum", label: "Impressum" },
  { href: "/datenschutz", label: "Datenschutz" },
] as const;

/**
 * Legal operator details (§5 DDG / Art. 13 GDPR).
 * Used on /impressum and /datenschutz only — never in the header, hero,
 * footer, game pages or any other public surface.
 */
export const LEGAL_ENTITY = {
  name: "Jannik Bolting",
  street: "Burenkamp 16",
  postalCode: "26127",
  city: "Oldenburg (Oldb)",
  country: "Deutschland",
} as const;

export const VTUBER = {
  src: "/brand/jannikjbi-vtuber.webp",
  width: 941,
  height: 1672,
  alt: "Der Avatar von Jannikjbi: eine Figur mit goldener Krone, Kopfhörern und schwarzem Hoodie.",
} as const;

export const AVATAR = {
  src: "/brand/jannikjbi-avatar.png",
  width: 500,
  height: 500,
  alt: "Profilbild von Jannikjbi.",
} as const;

/** Official Instant Gaming affiliate integration. */
export const INSTANT_GAMING = {
  affiliateId: "Jannikjbi",
  lang: "de",
  loaderSrc: "https://www.instant-gaming.com/api/banner/partner/loader.js",
  bannerClass: "jbi-ig-banner",
} as const;

export const TIMEZONE = "Europe/Berlin";
