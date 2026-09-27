import type { Metadata } from "next";
import { faCalendarDays } from "@fortawesome/free-solid-svg-icons";

import { NextStreamCard } from "@/components/home/NextStreamCard";
import { StreamRow } from "@/components/content/StreamRow";
import { EmptyState } from "@/components/ui/EmptyState";
import { getSiteSettings } from "@/server/content/settings";
import { listPastStreams, listUpcomingStreams } from "@/server/content/streams";
import { getTwitchLiveStatus } from "@/server/content/twitch";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Content & Streamplan",
  description:
    "Mein Streamplan: kommende Streams mit Datum, Uhrzeit, Spiel und Plattform.",
  alternates: { canonical: "/content" },
};

export default async function ContentPage() {
  const settings = await getSiteSettings();

  const [upcoming, past, live] = await Promise.all([
    listUpcomingStreams(20),
    listPastStreams(5),
    getTwitchLiveStatus(settings.twitchLogin),
  ]);

  const [next, ...rest] = upcoming;

  return (
    <div className="py-14 sm:py-16 lg:py-20">
      <div className="container-page">
        <header className="mb-10 max-w-2xl">
          <p className="eyebrow mb-3">Streamplan</p>
          <h1 className="text-3xl font-bold sm:text-4xl lg:text-[2.75rem]">Content</h1>
          <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-300">
            Wann ich streame, auf welcher Plattform und womit. Der Live-Status kommt direkt
            von Twitch – sofern verfügbar, sonst gilt der Plan unten.
          </p>
        </header>

        {live?.isLive || next ? (
          <section aria-labelledby="next-stream" className="mb-12">
            <h2
              id="next-stream"
              className="mb-4 font-display text-xs font-semibold tracking-[0.16em] text-ink-400 uppercase"
            >
              {live?.isLive ? "Gerade live" : "Nächster Stream"}
            </h2>
            <NextStreamCard stream={next ?? null} live={live} />
          </section>
        ) : null}

        <section aria-labelledby="upcoming-streams">
          <h2
            id="upcoming-streams"
            className="mb-4 font-display text-xs font-semibold tracking-[0.16em] text-ink-400 uppercase"
          >
            Kommende Streams
          </h2>

          {upcoming.length === 0 ? (
            <EmptyState
              icon={faCalendarDays}
              title="Aktuell sind keine Streams geplant."
              description="Sobald neue Termine feststehen, erscheinen sie hier."
            />
          ) : rest.length === 0 && !live?.isLive ? (
            <p className="text-sm text-ink-400">
              Über den nächsten Termin hinaus ist aktuell nichts eingetragen.
            </p>
          ) : (
            <ul className="space-y-3">
              {(live?.isLive ? upcoming : rest).map((stream) => (
                <StreamRow key={stream.id} stream={stream} />
              ))}
            </ul>
          )}
        </section>

        {past.length > 0 ? (
          <section aria-labelledby="past-streams" className="mt-14">
            <h2
              id="past-streams"
              className="mb-4 font-display text-xs font-semibold tracking-[0.16em] text-ink-400 uppercase"
            >
              Zuletzt gestreamt
            </h2>
            <ul className="space-y-3">
              {past.map((stream) => (
                <StreamRow key={stream.id} stream={stream} muted />
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
