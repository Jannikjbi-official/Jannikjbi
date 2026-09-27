import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faGamepad, faUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";

import { STREAM_PLATFORM_ICONS } from "@/lib/icons";
import type { StreamDTO, TwitchLiveDTO } from "@/lib/types";
import { STREAM_PLATFORM_LABELS } from "@/lib/content-constants";
import { formatDate, formatTimeRange, formatWeekday, safeExternalUrl } from "@/lib/utils";

type NextStreamCardProps = {
  stream: StreamDTO | null;
  live: TwitchLiveDTO | null;
};

/**
 * Live data from the Twitch API takes precedence; when the API is unavailable
 * or the channel is offline the card falls back to the manual schedule. If
 * neither exists, nothing is invented — the caller renders an empty state.
 */
export function NextStreamCard({ stream, live }: NextStreamCardProps) {
  if (live?.isLive) {
    return (
      <div className="card-surface overflow-hidden">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-red-400 uppercase">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-70" />
                <span className="relative inline-flex size-2 rounded-full bg-red-500" />
              </span>
              Live auf Twitch
            </span>

            {live.title ? (
              <h3 className="mt-3 font-display text-xl leading-snug font-semibold text-ink-100">
                {live.title}
              </h3>
            ) : null}

            {live.gameName ? (
              <p className="mt-2 flex items-center gap-2 text-sm text-ink-400">
                <FontAwesomeIcon icon={faGamepad} className="size-3.5" aria-hidden />
                {live.gameName}
              </p>
            ) : null}
          </div>

          <a
            href={live.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-gold-500 px-5 py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-gold-400"
          >
            Stream öffnen
            <FontAwesomeIcon icon={faUpRightFromSquare} className="size-3" aria-hidden />
          </a>
        </div>
      </div>
    );
  }

  if (!stream) return null;

  const link = safeExternalUrl(stream.link);

  return (
    <div className="card-surface overflow-hidden">
      <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="flex min-w-0 gap-5">
          {/* Date block reads as a calendar tile without drawing a fake HUD. */}
          <div className="flex size-16 shrink-0 flex-col items-center justify-center rounded-xl border border-ink-700 bg-ink-850">
            <span className="font-display text-xl leading-none font-bold text-gold-500">
              {new Date(stream.date).getUTCDate()}
            </span>
            <span className="mt-1 text-[0.625rem] font-semibold tracking-wider text-ink-400 uppercase">
              {new Intl.DateTimeFormat("de-DE", { month: "short", timeZone: "UTC" }).format(
                new Date(stream.date),
              )}
            </span>
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-[0.14em] text-ink-400 uppercase">
              {formatWeekday(stream.date)}, {formatDate(stream.date)}
            </p>

            <h3 className="mt-2 font-display text-xl leading-snug font-semibold text-ink-100">
              {stream.title}
            </h3>

            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-400">
              <span className="inline-flex items-center gap-2">
                <FontAwesomeIcon icon={faClock} className="size-3.5" aria-hidden />
                {formatTimeRange(stream.startTime, stream.endTime)}
              </span>

              <span className="inline-flex items-center gap-2">
                <FontAwesomeIcon
                  icon={STREAM_PLATFORM_ICONS[stream.platform]}
                  className="size-3.5"
                  aria-hidden
                />
                {STREAM_PLATFORM_LABELS[stream.platform]}
              </span>

              {stream.game ? (
                <Link
                  href={`/games/${stream.game.slug}`}
                  className="inline-flex items-center gap-2 text-ink-300 transition-colors hover:text-gold-400"
                >
                  <FontAwesomeIcon icon={faGamepad} className="size-3.5" aria-hidden />
                  {stream.game.name}
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-ink-700 px-5 py-2.5 text-sm font-semibold text-ink-100 transition-colors hover:border-gold-500/50 hover:text-gold-400"
          >
            Zum Kanal
            <FontAwesomeIcon icon={faUpRightFromSquare} className="size-3" aria-hidden />
          </a>
        ) : null}
      </div>
    </div>
  );
}
