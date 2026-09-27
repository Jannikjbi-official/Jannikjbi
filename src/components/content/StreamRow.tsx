import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faGamepad, faUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";

import { STREAM_PLATFORM_ICONS } from "@/lib/icons";
import type { StreamDTO } from "@/lib/types";
import { STREAM_PLATFORM_LABELS } from "@/lib/content-constants";
import { cn, formatDate, formatTimeRange, formatWeekday, safeExternalUrl } from "@/lib/utils";

export function StreamRow({ stream, muted = false }: { stream: StreamDTO; muted?: boolean }) {
  const link = safeExternalUrl(stream.link);
  const date = new Date(stream.date);

  return (
    <li
      className={cn(
        "card-surface flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-6",
        muted && "opacity-70",
      )}
    >
      <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl border border-ink-700 bg-ink-850">
        <span className="font-display text-lg leading-none font-bold text-gold-500">
          {date.getUTCDate()}
        </span>
        <span className="mt-0.5 text-[0.5625rem] font-semibold tracking-wider text-ink-400 uppercase">
          {new Intl.DateTimeFormat("de-DE", { month: "short", timeZone: "UTC" }).format(date)}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold tracking-[0.12em] text-ink-500 uppercase">
          {formatWeekday(stream.date)}, {formatDate(stream.date)}
        </p>

        <h3 className="mt-1.5 font-display text-base font-semibold text-ink-100">
          {stream.title}
        </h3>

        {stream.description ? (
          <p className="mt-2 text-sm leading-relaxed text-ink-400">{stream.description}</p>
        ) : null}

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

          {/* A stream linked to a game links straight through to that game. */}
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

      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg border border-ink-700 px-4 py-2 text-sm font-semibold text-ink-100 transition-colors hover:border-gold-500/50 hover:text-gold-400 sm:self-auto"
        >
          Ansehen
          <FontAwesomeIcon icon={faUpRightFromSquare} className="size-3" aria-hidden />
        </a>
      ) : null}
    </li>
  );
}
