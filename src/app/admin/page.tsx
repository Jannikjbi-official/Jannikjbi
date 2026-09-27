import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faDiagramProject,
  faGamepad,
  faHandshake,
  faShareNodes,
  faTags,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

import { PageHeading } from "@/components/admin/PageHeading";
import { getCmsStats } from "@/server/content/stats";
import { listUpcomingStreams } from "@/server/content/streams";
import { formatDate, formatTimeRange } from "@/lib/utils";

export const dynamic = "force-dynamic";

type StatCard = {
  href: string;
  label: string;
  icon: IconDefinition;
  value: number;
  hint: string;
};

export default async function AdminDashboardPage() {
  // Every figure is a live count from MongoDB — a fresh install shows zeros.
  const [stats, upcoming] = await Promise.all([getCmsStats(), listUpcomingStreams(4)]);

  const cards: StatCard[] = [
    {
      href: "/admin/games",
      label: "Games",
      icon: faGamepad,
      value: stats.games.total,
      hint: `${stats.games.active} öffentlich · ${stats.games.featured} featured`,
    },
    {
      href: "/admin/genres",
      label: "Genres",
      icon: faTags,
      value: stats.genres.total,
      hint: `${stats.genres.active} aktiv`,
    },
    {
      href: "/admin/streams",
      label: "Streams",
      icon: faCalendarDays,
      value: stats.streams.total,
      hint: `${stats.streams.upcoming} kommend`,
    },
    {
      href: "/admin/projects",
      label: "Projekte",
      icon: faDiagramProject,
      value: stats.projects.total,
      hint: `${stats.projects.active} öffentlich`,
    },
    {
      href: "/admin/social",
      label: "Social Links",
      icon: faShareNodes,
      value: stats.socialLinks.total,
      hint: `${stats.socialLinks.active} aktiv`,
    },
    {
      href: "/admin/partners",
      label: "Partner",
      icon: faHandshake,
      value: stats.partners.total,
      hint: `${stats.partners.active} aktiv`,
    },
  ];

  return (
    <>
      <PageHeading
        title="Dashboard"
        description="Überblick über alle Inhalte deiner Website."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group card-surface p-5 transition-colors hover:border-ink-600"
          >
            <div className="flex items-start justify-between">
              <span className="flex size-9 items-center justify-center rounded-lg bg-ink-800 text-ink-400 transition-colors group-hover:text-gold-500">
                <FontAwesomeIcon icon={card.icon} className="size-4" aria-hidden />
              </span>
              <span className="font-display text-3xl font-bold text-ink-100 tabular-nums">
                {card.value}
              </span>
            </div>
            <p className="mt-4 font-display text-sm font-semibold text-ink-100">{card.label}</p>
            <p className="mt-1 text-xs text-ink-500">{card.hint}</p>
          </Link>
        ))}
      </div>

      <section className="mt-10" aria-labelledby="upcoming">
        <h2 id="upcoming" className="mb-4 font-display text-base font-semibold text-ink-100">
          Nächste Streams
        </h2>

        {upcoming.length === 0 ? (
          <div className="card-surface p-6">
            <p className="text-sm text-ink-400">
              Aktuell sind keine Streams geplant.{" "}
              <Link href="/admin/streams" className="text-gold-400 hover:underline">
                Termin eintragen
              </Link>
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((stream) => (
              <li
                key={stream.id}
                className="card-surface flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-semibold text-ink-100">
                    {stream.title}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-500">
                    {formatDate(stream.date)} · {formatTimeRange(stream.startTime, stream.endTime)}
                    {stream.game ? ` · ${stream.game.name}` : ""}
                  </p>
                </div>
                {!stream.active ? (
                  <span className="rounded-full border border-ink-600 bg-ink-800 px-2.5 py-1 text-[0.6875rem] font-semibold text-ink-400 uppercase">
                    Ausgeblendet
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
