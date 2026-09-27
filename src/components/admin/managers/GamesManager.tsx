"use client";

import { faGamepad } from "@fortawesome/free-solid-svg-icons";

import { GAME_STATUSES, GAME_STATUS_LABELS } from "@/lib/content-constants";
import type { GameDTO, GenreDTO } from "@/lib/types";
import { GameStatusChip } from "@/components/ui/StatusChip";

import { ResourceManager, type Column } from "../ResourceManager";
import { ActiveBadge, FeaturedBadge, MutedCell } from "./cells";

const columns: Column<GameDTO>[] = [
  {
    key: "name",
    label: "Spiel",
    isRowHeader: true,
    render: (game) => (
      <span className="block">
        <span className="block font-medium text-ink-100">{game.name}</span>
        <span className="block text-xs text-ink-500">/{game.slug}</span>
      </span>
    ),
  },
  {
    key: "genres",
    label: "Genres",
    render: (game) => (
      <MutedCell>
        {game.genres.length > 0 ? game.genres.map((genre) => genre.name).join(", ") : "–"}
      </MutedCell>
    ),
  },
  { key: "status", label: "Status", render: (game) => <GameStatusChip status={game.status} /> },
  { key: "featured", label: "Featured", render: (game) => <FeaturedBadge featured={game.featured} /> },
  { key: "active", label: "Sichtbar", render: (game) => <ActiveBadge active={game.active} /> },
];

export function GamesManager({
  initialItems,
  genres,
}: {
  initialItems: GameDTO[];
  genres: GenreDTO[];
}) {
  const genreOptions = genres.map((genre) => ({
    value: genre.id,
    label: genre.active ? genre.name : `${genre.name} (inaktiv)`,
  }));

  return (
    <ResourceManager<GameDTO>
      endpoint="/api/admin/games"
      initialItems={initialItems}
      columns={columns}
      singular="Spiel"
      plural="Spiele"
      emptyIcon={faGamepad}
      emptyTitle="Noch keine Spiele vorhanden."
      emptyDescription="Lege dein erstes Spiel an – es erscheint anschließend automatisch auf der Website."
      searchFields={(game) => `${game.name} ${game.slug} ${game.genres.map((g) => g.name).join(" ")}`}
      hasActiveToggle
      hasDuplicate
      hasSorting
      emptyValues={{
        name: "",
        slug: "",
        tagline: "",
        description: "",
        image: { url: "", alt: "" },
        genres: [],
        status: "aktuell",
        platform: [],
        releaseDate: "",
        steamUrl: "",
        websiteUrl: "",
        twitchUrl: "",
        youtubeUrl: "",
        active: true,
        featured: false,
        sortOrder: 0,
      }}
      toFormValues={(game) => ({
        name: game.name,
        slug: game.slug,
        tagline: game.tagline ?? "",
        description: game.description,
        image: { url: game.image?.url ?? "", alt: game.image?.alt ?? "" },
        genres: game.genres.map((genre) => genre.id),
        status: game.status,
        platform: game.platform,
        releaseDate: game.releaseDate ? game.releaseDate.slice(0, 10) : "",
        steamUrl: game.steamUrl ?? "",
        websiteUrl: game.websiteUrl ?? "",
        twitchUrl: game.twitchUrl ?? "",
        youtubeUrl: game.youtubeUrl ?? "",
        active: game.active,
        featured: game.featured,
        sortOrder: game.sortOrder,
      })}
      fields={[
        { kind: "text", name: "name", label: "Name", required: true, placeholder: "Transport Fever 2" },
        { kind: "slug", name: "slug", label: "Slug", from: "name", help: "Ergibt /games/<slug>." },
        { kind: "text", name: "tagline", label: "Kurzbeschreibung", span: 2, help: "Eine Zeile für die Game-Card." },
        { kind: "textarea", name: "description", label: "Beschreibung", rows: 6, required: true, span: 2 },
        { kind: "image", name: "image", label: "Cover", span: 2 },
        { kind: "multiselect", name: "genres", label: "Genres", options: genreOptions, span: 2 },
        {
          kind: "select",
          name: "status",
          label: "Status",
          options: GAME_STATUSES.map((status) => ({
            value: status,
            label: GAME_STATUS_LABELS[status],
          })),
        },
        { kind: "tags", name: "platform", label: "Plattformen", placeholder: "PC, Steam, Konsole" },
        { kind: "date", name: "releaseDate", label: "Release" },
        { kind: "number", name: "sortOrder", label: "Reihenfolge" },
        { kind: "url", name: "steamUrl", label: "Steam-Link" },
        { kind: "url", name: "websiteUrl", label: "Offizielle Website" },
        { kind: "url", name: "twitchUrl", label: "Twitch-Link" },
        { kind: "url", name: "youtubeUrl", label: "YouTube-Link" },
        { kind: "switch", name: "active", label: "Öffentlich sichtbar" },
        { kind: "switch", name: "featured", label: "Als Featured hervorheben" },
      ]}
    />
  );
}
