"use client";

import { useState } from "react";

import { NOTION_DB_KEYS, NOTION_DB_LABELS, type NotionDbKey } from "@/lib/notion-manage-types";
import { cn } from "@/lib/utils";

import { NotionTable } from "./NotionTable";

/**
 * Tabbed view over the four Creator Buddy databases.
 *
 * Each tab mounts its own table, which loads on first open rather than all four
 * at once — four Notion round trips on page load would be slow for nothing.
 */
export function CreatorBuddyPanel({ available }: { available: Record<NotionDbKey, boolean> }) {
  const first = NOTION_DB_KEYS.find((key) => available[key]) ?? "content";
  const [active, setActive] = useState<NotionDbKey>(first);

  return (
    <div>
      <div role="tablist" aria-label="Creator-Buddy-Datenbanken" className="mb-6 flex flex-wrap gap-1 border-b border-ink-800">
        {NOTION_DB_KEYS.map((key) => {
          const isActive = key === active;
          const isAvailable = available[key];

          return (
            <button
              key={key}
              role="tab"
              type="button"
              aria-selected={isActive}
              disabled={!isAvailable}
              onClick={() => setActive(key)}
              className={cn(
                "relative -mb-px px-4 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "text-ink-100"
                  : isAvailable
                    ? "text-ink-400 hover:text-ink-200"
                    : "cursor-not-allowed text-ink-600",
              )}
              title={isAvailable ? undefined : "Keine Datenbank-ID hinterlegt"}
            >
              {NOTION_DB_LABELS[key]}
              {isActive ? (
                <span aria-hidden className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-gold-500" />
              ) : null}
            </button>
          );
        })}
      </div>

      {available[active] ? (
        // Keyed so switching tabs remounts and loads that database fresh.
        <NotionTable key={active} dbKey={active} />
      ) : (
        <p className="text-sm text-ink-400">
          Für diesen Bereich ist keine Datenbank-ID hinterlegt. Trage sie unter{" "}
          <span className="text-ink-200">Einstellungen</span> ein.
        </p>
      )}
    </div>
  );
}
