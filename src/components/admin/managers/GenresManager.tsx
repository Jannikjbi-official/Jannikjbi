"use client";

import { faTags } from "@fortawesome/free-solid-svg-icons";

import type { GenreDTO } from "@/lib/types";
import { ResourceManager, type Column } from "../ResourceManager";
import { ActiveBadge, MutedCell } from "./cells";

const columns: Column<GenreDTO>[] = [
  {
    key: "name",
    label: "Name",
    isRowHeader: true,
    render: (genre) => (
      <span className="flex items-center gap-2.5">
        {genre.color ? (
          <span
            aria-hidden
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: genre.color }}
          />
        ) : null}
        <span className="font-medium text-ink-100">{genre.name}</span>
      </span>
    ),
  },
  { key: "slug", label: "Slug", render: (genre) => <MutedCell>{genre.slug}</MutedCell> },
  {
    key: "sortOrder",
    label: "Reihenfolge",
    render: (genre) => <MutedCell>{genre.sortOrder}</MutedCell>,
  },
  { key: "active", label: "Status", render: (genre) => <ActiveBadge active={genre.active} /> },
];

export function GenresManager({ initialItems }: { initialItems: GenreDTO[] }) {
  return (
    <ResourceManager<GenreDTO>
      endpoint="/api/admin/genres"
      initialItems={initialItems}
      columns={columns}
      singular="Genre"
      plural="Genres"
      emptyIcon={faTags}
      emptyTitle="Noch keine Genres vorhanden."
      emptyDescription="Lege Genres an, um sie anschließend deinen Spielen zuzuordnen."
      searchFields={(genre) => `${genre.name} ${genre.slug}`}
      hasActiveToggle
      hasSorting
      emptyValues={{
        name: "",
        slug: "",
        description: "",
        color: "",
        active: true,
        sortOrder: 0,
      }}
      toFormValues={(genre) => ({
        name: genre.name,
        slug: genre.slug,
        description: genre.description ?? "",
        color: genre.color ?? "",
        active: genre.active,
        sortOrder: genre.sortOrder,
      })}
      fields={[
        { kind: "text", name: "name", label: "Name", required: true, placeholder: "Simulation" },
        { kind: "slug", name: "slug", label: "Slug", from: "name", help: "Teil der URL im Genre-Filter." },
        { kind: "textarea", name: "description", label: "Beschreibung", rows: 3, span: 2 },
        { kind: "color", name: "color", label: "Farbe", help: "Optional – färbt den Genre-Chip." },
        { kind: "number", name: "sortOrder", label: "Reihenfolge" },
        { kind: "switch", name: "active", label: "Öffentlich sichtbar", span: 2 },
      ]}
    />
  );
}
