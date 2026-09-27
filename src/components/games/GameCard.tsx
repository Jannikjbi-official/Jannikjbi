import Image from "next/image";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGamepad } from "@fortawesome/free-solid-svg-icons";

import type { GameDTO } from "@/lib/types";
import { GameStatusChip, GenreChip } from "@/components/ui/StatusChip";
import { truncate } from "@/lib/utils";

/**
 * Game card. Only renders what the document actually contains — a game with no
 * cover gets a typographic placeholder rather than a stock image, and missing
 * fields are simply left out.
 */
export function GameCard({ game, priority = false }: { game: GameDTO; priority?: boolean }) {
  const summary = game.tagline || truncate(game.description, 120);

  return (
    <article className="group card-surface overflow-hidden transition-colors duration-200 hover:border-ink-600">
      <Link href={`/games/${game.slug}`} className="block focus-visible:outline-none">
        <div className="relative aspect-[16/10] overflow-hidden bg-ink-850">
          {game.image ? (
            <Image
              src={game.image.url}
              alt={game.image.alt || `Cover von ${game.name}`}
              fill
              sizes="(min-width: 1024px) 380px, (min-width: 640px) 45vw, 92vw"
              priority={priority}
              className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-ink-600">
              <FontAwesomeIcon icon={faGamepad} className="size-8" aria-hidden />
            </div>
          )}

          {game.featured ? (
            <span className="absolute top-3 left-3 rounded-full bg-gold-500 px-2.5 py-1 text-[0.6875rem] font-bold tracking-wide text-ink-950 uppercase">
              Featured
            </span>
          ) : null}
        </div>

        <div className="p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <h3 className="font-display text-lg leading-snug font-semibold text-ink-100 transition-colors group-hover:text-gold-400">
              {game.name}
            </h3>
            <GameStatusChip status={game.status} />
          </div>

          {summary ? (
            <p className="text-sm leading-relaxed text-ink-400">{summary}</p>
          ) : null}

          {game.genres.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {game.genres.slice(0, 3).map((genre) => (
                <li key={genre.id}>
                  <GenreChip name={genre.name} color={genre.color} />
                </li>
              ))}
              {game.genres.length > 3 ? (
                <li className="self-center text-xs text-ink-500">
                  +{game.genres.length - 3}
                </li>
              ) : null}
            </ul>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
