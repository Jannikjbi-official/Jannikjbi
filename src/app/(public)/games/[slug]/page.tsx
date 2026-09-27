import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSteam, faTwitch, faYoutube } from "@fortawesome/free-brands-svg-icons";
import {
  faArrowLeft,
  faCalendarDays,
  faGamepad,
  faGlobe,
  faUpRightFromSquare,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

import { GameStatusChip, GenreChip } from "@/components/ui/StatusChip";
import { SITE_URL } from "@/lib/site";
import { formatDate, safeExternalUrl, toParagraphs, truncate } from "@/lib/utils";
import { getPublicGameBySlug, listPublicGameSlugs } from "@/server/content/games";

export const revalidate = 60;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await listPublicGameSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const game = await getPublicGameBySlug(slug);

  if (!game) return { title: "Spiel nicht gefunden" };

  const description = game.tagline || truncate(game.description, 160);

  return {
    title: game.name,
    description,
    alternates: { canonical: `/games/${game.slug}` },
    openGraph: {
      title: game.name,
      description,
      url: `${SITE_URL}/games/${game.slug}`,
      type: "article",
      images: game.image ? [{ url: game.image.url, alt: game.image.alt ?? game.name }] : undefined,
    },
  };
}

type ExternalLink = { href: string; label: string; icon: IconDefinition };

export default async function GameDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const game = await getPublicGameBySlug(slug);

  if (!game) notFound();

  // Only links that actually exist are rendered — nothing is invented.
  const links: ExternalLink[] = (
    [
      { href: game.steamUrl, label: "Steam", icon: faSteam },
      { href: game.websiteUrl, label: "Offizielle Website", icon: faGlobe },
      { href: game.twitchUrl, label: "Twitch", icon: faTwitch },
      { href: game.youtubeUrl, label: "YouTube", icon: faYoutube },
    ] as const
  ).flatMap(({ href, label, icon }) => {
    const safe = safeExternalUrl(href);
    return safe ? [{ href: safe, label, icon }] : [];
  });

  const facts: Array<{ label: string; value: string }> = [];
  if (game.platform.length > 0) facts.push({ label: "Plattform", value: game.platform.join(", ") });
  if (game.releaseDate) facts.push({ label: "Release", value: formatDate(game.releaseDate) });

  const paragraphs = toParagraphs(game.description);

  return (
    <article className="py-10 sm:py-14 lg:py-16">
      <div className="container-page">
        <Link
          href="/games"
          className="inline-flex items-center gap-2 text-sm font-medium text-ink-400 transition-colors hover:text-ink-100"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="size-3" aria-hidden />
          Alle Games
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14">
          <div className="lg:order-2">
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-ink-700 bg-ink-850">
              {game.image ? (
                <Image
                  src={game.image.url}
                  alt={game.image.alt || `Cover von ${game.name}`}
                  fill
                  priority
                  sizes="(min-width: 1024px) 520px, 92vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-ink-600">
                  <FontAwesomeIcon icon={faGamepad} className="size-10" aria-hidden />
                </div>
              )}
            </div>

            {facts.length > 0 || links.length > 0 ? (
              <div className="mt-6 card-surface p-5">
                {facts.length > 0 ? (
                  <dl className="space-y-3">
                    {facts.map((fact) => (
                      <div key={fact.label} className="flex items-baseline justify-between gap-4">
                        <dt className="text-xs font-semibold tracking-wide text-ink-500 uppercase">
                          {fact.label}
                        </dt>
                        <dd className="text-right text-sm text-ink-200">{fact.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}

                {links.length > 0 ? (
                  <ul
                    className={
                      facts.length > 0
                        ? "mt-5 space-y-2 border-t border-ink-800 pt-5"
                        : "space-y-2"
                    }
                  >
                    {links.map((link) => (
                      <li key={link.href}>
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-200 transition-colors hover:bg-ink-850 hover:text-gold-400"
                        >
                          <span className="inline-flex items-center gap-3">
                            <FontAwesomeIcon icon={link.icon} className="size-4" aria-hidden />
                            {link.label}
                          </span>
                          <FontAwesomeIcon
                            icon={faUpRightFromSquare}
                            className="size-3 text-ink-600 transition-colors group-hover:text-gold-400"
                            aria-hidden
                          />
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="lg:order-1">
            <div className="flex flex-wrap items-center gap-3">
              <GameStatusChip status={game.status} />
              {game.featured ? (
                <span className="rounded-full bg-gold-500 px-2.5 py-1 text-[0.6875rem] font-bold tracking-wide text-ink-950 uppercase">
                  Featured
                </span>
              ) : null}
            </div>

            <h1 className="mt-4 text-3xl font-bold sm:text-4xl lg:text-[2.75rem]">{game.name}</h1>

            {game.tagline ? (
              <p className="mt-4 text-lg leading-relaxed text-ink-200">{game.tagline}</p>
            ) : null}

            {game.genres.length > 0 ? (
              <ul className="mt-6 flex flex-wrap gap-2">
                {game.genres.map((genre) => (
                  <li key={genre.id}>
                    <Link href={`/games?genre=${genre.slug}`}>
                      <GenreChip name={genre.name} color={genre.color} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-8 space-y-4">
              {paragraphs.map((paragraph, index) => (
                <p key={index} className="text-[0.9375rem] leading-relaxed text-ink-300">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="mt-10">
              <Link
                href="/content"
                className="inline-flex items-center gap-2 text-sm font-medium text-ink-300 transition-colors hover:text-gold-400"
              >
                <FontAwesomeIcon icon={faCalendarDays} className="size-3.5" aria-hidden />
                Streams zu diesem Spiel im Streamplan
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
