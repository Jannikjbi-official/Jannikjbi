import type { Metadata } from "next";
import { Suspense } from "react";
import { faGamepad } from "@fortawesome/free-solid-svg-icons";

import { GameCard } from "@/components/games/GameCard";
import { GamesFilterBar } from "@/components/games/GamesFilterBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { listPublicGames } from "@/server/content/games";
import { listPublicGenres } from "@/server/content/genres";
import {
  GAME_SORTS,
  GAME_STATUSES,
  type GameSort,
  type GameStatus,
} from "@/lib/content-constants";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Games",
  description:
    "Alle Spiele, mit denen ich mich beschäftige – filterbar nach Genre und Status.",
  alternates: { canonical: "/games" },
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function single(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

export default async function GamesPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const q = single(params.q);
  const genre = single(params.genre);
  const statusParam = single(params.status);
  const sortParam = single(params.sort);

  const status = GAME_STATUSES.includes(statusParam as GameStatus)
    ? (statusParam as GameStatus)
    : undefined;
  const sort = GAME_SORTS.includes(sortParam as GameSort)
    ? (sortParam as GameSort)
    : "standard";

  const [games, genres] = await Promise.all([
    listPublicGames({ search: q || undefined, genreSlug: genre || undefined, status, sort }),
    listPublicGenres(),
  ]);

  const featured = games.filter((game) => game.featured);
  const rest = games.filter((game) => !game.featured);
  const hasFilters = Boolean(q || genre || status);

  return (
    <div className="py-14 sm:py-16 lg:py-20">
      <div className="container-page">
        <header className="mb-10 max-w-2xl">
          <p className="eyebrow mb-3">Übersicht</p>
          <h1 className="text-3xl font-bold sm:text-4xl lg:text-[2.75rem]">Games</h1>
          <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-300">
            Simulationen, Aufbau, Management und alles andere, was gerade auf dem Plan
            steht. Die Liste wächst laufend.
          </p>
        </header>

        <Suspense fallback={<div className="mb-8 h-12 rounded-xl bg-ink-880" />}>
          <GamesFilterBar genres={genres} initial={{ q, genre, status: statusParam, sort }} />
        </Suspense>

        {games.length === 0 ? (
          <EmptyState
            icon={faGamepad}
            title={hasFilters ? "Keine Treffer." : "Noch keine Spiele vorhanden."}
            description={
              hasFilters
                ? "Für diese Kombination aus Suche und Filtern gibt es aktuell nichts. Passe die Auswahl an."
                : "Sobald Spiele im Dashboard angelegt sind, erscheinen sie hier automatisch."
            }
          />
        ) : (
          <div className="space-y-12">
            {featured.length > 0 && !hasFilters ? (
              <section aria-labelledby="featured-games">
                <h2
                  id="featured-games"
                  className="mb-5 font-display text-xs font-semibold tracking-[0.16em] text-ink-400 uppercase"
                >
                  Featured
                </h2>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {featured.map((game, index) => (
                    <GameCard key={game.id} game={game} priority={index < 3} />
                  ))}
                </div>
              </section>
            ) : null}

            <section aria-labelledby="all-games">
              <h2
                id="all-games"
                className="mb-5 font-display text-xs font-semibold tracking-[0.16em] text-ink-400 uppercase"
              >
                {hasFilters ? `${games.length} Treffer` : "Alle Spiele"}
              </h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {(hasFilters ? games : rest).map((game, index) => (
                  <GameCard key={game.id} game={game} priority={featured.length === 0 && index < 3} />
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
