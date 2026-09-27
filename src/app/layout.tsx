import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Plus_Jakarta_Sans } from "next/font/google";

import "@/lib/fontawesome";
import "./globals.css";

import { SITE_DEFAULTS, SITE_URL } from "@/lib/site";
import { getSiteSettings } from "@/server/content/settings";

/**
 * Space Grotesk carries the headings (geometric, a little technical), Plus
 * Jakarta Sans the body copy. Deliberately not Inter/Poppins/Roboto.
 */
const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display-family",
  display: "swap",
});

const body = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#08080a",
  colorScheme: "dark",
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  const title = settings.seo.metaTitle || settings.siteTitle || SITE_DEFAULTS.siteTitle;
  const description =
    settings.seo.metaDescription || settings.description || SITE_DEFAULTS.description;
  const canonical = settings.seo.canonicalUrl || SITE_URL;
  const ogImage = settings.seo.ogImage || "/brand/jannikjbi-avatar.png";

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: `%s – ${settings.creatorName}`,
    },
    description,
    applicationName: settings.creatorName,
    keywords:
      settings.seo.keywords.length > 0
        ? settings.seo.keywords
        : ["Jannikjbi", "Gaming", "Streaming", "Content", "Simulation", "Aufbauspiele"],
    authors: [{ name: settings.creatorName, url: SITE_URL }],
    creator: settings.creatorName,
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: "de_DE",
      url: canonical,
      siteName: settings.creatorName,
      title,
      description,
      images: [{ url: ogImage, alt: `${settings.creatorName} – Logo` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
    icons: {
      icon: "/brand/jannikjbi-avatar.png",
      apple: "/brand/jannikjbi-avatar.png",
    },
  };
}

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();

  // The accent is editable in the CMS. Re-checked here so only a literal hex
  // value can ever reach the stylesheet.
  const accent = HEX.test(settings.accentColor)
    ? settings.accentColor
    : SITE_DEFAULTS.accentColor;

  return (
    <html lang="de" className={`dark ${display.variable} ${body.variable}`}>
      <head>
        {accent !== SITE_DEFAULTS.accentColor ? (
          <style>{`:root{--color-gold-500:${accent};--accent:${accent};--focus:${accent};}`}</style>
        ) : null}
      </head>
      <body className="min-h-dvh bg-ink-950 text-ink-100 antialiased">{children}</body>
    </html>
  );
}
