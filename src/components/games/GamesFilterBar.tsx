"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Label, ListBox, SearchField, Select, Spinner } from "@heroui/react";
import type { Key } from "@heroui/react";

import type { GenreDTO } from "@/lib/types";
import {
  GAME_SORTS,
  GAME_SORT_LABELS,
  GAME_STATUSES,
  GAME_STATUS_LABELS,
  type GameSort,
} from "@/lib/content-constants";

const ALL = "__all__";

type GamesFilterBarProps = {
  genres: GenreDTO[];
  initial: {
    q: string;
    genre: string;
    status: string;
    sort: GameSort;
  };
};

/**
 * Filtering happens on the server through the URL, so results stay
 * linkable, shareable and reachable without JavaScript enabled beyond this bar.
 */
export function GamesFilterBar({ genres, initial }: GamesFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(initial.q);

  const push = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (!value || value === ALL) params.delete(key);
        else params.set(key, value);
      }

      const query = params.toString();
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  // Debounce the search field so typing does not fire a request per keystroke.
  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (search === current) return;

    const timer = setTimeout(() => push({ q: search.trim() || null }), 350);
    return () => clearTimeout(timer);
  }, [search, searchParams, push]);

  return (
    <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]">
      <SearchField
        aria-label="Spiele durchsuchen"
        value={search}
        onChange={setSearch}
        className="w-full"
      >
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input placeholder="Spiel suchen …" />
          {search ? <SearchField.ClearButton /> : null}
        </SearchField.Group>
      </SearchField>

      <Select
        aria-label="Nach Genre filtern"
        placeholder="Alle Genres"
        value={initial.genre || ALL}
        onChange={(key: Key | null) => push({ genre: key ? String(key) : null })}
        className="w-full"
      >
        <Label className="sr-only">Genre</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            <ListBox.Item id={ALL} textValue="Alle Genres">
              Alle Genres
              <ListBox.ItemIndicator />
            </ListBox.Item>
            {genres.map((genre) => (
              <ListBox.Item key={genre.id} id={genre.slug} textValue={genre.name}>
                {genre.name}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>

      <Select
        aria-label="Nach Status filtern"
        placeholder="Alle Status"
        value={initial.status || ALL}
        onChange={(key: Key | null) => push({ status: key ? String(key) : null })}
        className="w-full"
      >
        <Label className="sr-only">Status</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            <ListBox.Item id={ALL} textValue="Alle Status">
              Alle Status
              <ListBox.ItemIndicator />
            </ListBox.Item>
            {GAME_STATUSES.map((status) => (
              <ListBox.Item key={status} id={status} textValue={GAME_STATUS_LABELS[status]}>
                {GAME_STATUS_LABELS[status]}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>

      <div className="relative">
        <Select
          aria-label="Sortierung"
          value={initial.sort}
          onChange={(key: Key | null) => push({ sort: key ? String(key) : null })}
          className="w-full"
        >
          <Label className="sr-only">Sortierung</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {GAME_SORTS.map((sort) => (
                <ListBox.Item key={sort} id={sort} textValue={GAME_SORT_LABELS[sort]}>
                  {GAME_SORT_LABELS[sort]}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>

        {isPending ? (
          <span className="pointer-events-none absolute top-1/2 -right-7 -translate-y-1/2">
            <Spinner size="sm" aria-label="Wird geladen" />
          </span>
        ) : null}
      </div>
    </div>
  );
}
