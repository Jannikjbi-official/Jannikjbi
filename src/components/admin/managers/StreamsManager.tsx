"use client";

import { faCalendarDays } from "@fortawesome/free-solid-svg-icons";

import { STREAM_PLATFORMS, STREAM_PLATFORM_LABELS } from "@/lib/content-constants";
import type { GameDTO, StreamDTO } from "@/lib/types";
import { formatShortDate, formatTimeRange } from "@/lib/utils";

import { ResourceManager, type Column } from "../ResourceManager";
import { ActiveBadge, MutedCell } from "./cells";

const columns: Column<StreamDTO>[] = [
  {
    key: "date",
    label: "Termin",
    isRowHeader: true,
    render: (stream) => (
      <span className="block">
        <span className="block font-medium text-ink-100">{formatShortDate(stream.date)}</span>
        <span className="block text-xs text-ink-500">
          {formatTimeRange(stream.startTime, stream.endTime)}
        </span>
      </span>
    ),
  },
  { key: "title", label: "Titel", render: (stream) => <MutedCell>{stream.title}</MutedCell> },
  {
    key: "game",
    label: "Spiel",
    render: (stream) => <MutedCell>{stream.game?.name ?? "–"}</MutedCell>,
  },
  {
    key: "platform",
    label: "Plattform",
    render: (stream) => <MutedCell>{STREAM_PLATFORM_LABELS[stream.platform]}</MutedCell>,
  },
  { key: "active", label: "Sichtbar", render: (stream) => <ActiveBadge active={stream.active} /> },
];

export function StreamsManager({
  initialItems,
  games,
}: {
  initialItems: StreamDTO[];
  games: GameDTO[];
}) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <ResourceManager<StreamDTO>
      endpoint="/api/admin/streams"
      initialItems={initialItems}
      columns={columns}
      singular="Stream"
      plural="Streams"
      emptyIcon={faCalendarDays}
      emptyTitle="Noch keine Streams vorhanden."
      emptyDescription="Trage deinen ersten Termin ein – er erscheint dann im öffentlichen Streamplan."
      searchFields={(stream) => `${stream.title} ${stream.game?.name ?? ""}`}
      hasActiveToggle
      emptyValues={{
        date: today,
        startTime: "19:00",
        endTime: "",
        title: "",
        description: "",
        game: "",
        platform: "twitch",
        link: "",
        active: true,
      }}
      toFormValues={(stream) => ({
        date: stream.date.slice(0, 10),
        startTime: stream.startTime,
        endTime: stream.endTime ?? "",
        title: stream.title,
        description: stream.description ?? "",
        game: stream.game?.id ?? "",
        platform: stream.platform,
        link: stream.link ?? "",
        active: stream.active,
      })}
      fields={[
        { kind: "text", name: "title", label: "Titel", required: true, span: 2 },
        { kind: "date", name: "date", label: "Datum" },
        {
          kind: "select",
          name: "platform",
          label: "Plattform",
          options: STREAM_PLATFORMS.map((platform) => ({
            value: platform,
            label: STREAM_PLATFORM_LABELS[platform],
          })),
        },
        { kind: "time", name: "startTime", label: "Start" },
        { kind: "time", name: "endTime", label: "Ende", help: "Optional." },
        {
          kind: "select",
          name: "game",
          label: "Spiel",
          span: 2,
          options: [
            { value: "", label: "Kein Spiel zugeordnet" },
            ...games.map((game) => ({ value: game.id, label: game.name })),
          ],
          help: "Ein zugeordnetes Spiel wird im Streamplan automatisch verlinkt.",
        },
        { kind: "textarea", name: "description", label: "Beschreibung", rows: 3, span: 2 },
        { kind: "url", name: "link", label: "Link zum Stream", span: 2 },
        { kind: "switch", name: "active", label: "Im öffentlichen Plan anzeigen", span: 2 },
      ]}
    />
  );
}
