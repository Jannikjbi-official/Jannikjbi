"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShareNodes } from "@fortawesome/free-solid-svg-icons";

import { SOCIAL_PLATFORMS, SOCIAL_PLATFORM_LABELS } from "@/lib/content-constants";
import { SOCIAL_ICONS } from "@/lib/icons";
import type { SocialLinkDTO } from "@/lib/types";
import { displayHost } from "@/lib/utils";

import { ResourceManager, type Column } from "../ResourceManager";
import { ActiveBadge, MutedCell } from "./cells";

const columns: Column<SocialLinkDTO>[] = [
  {
    key: "platform",
    label: "Kanal",
    isRowHeader: true,
    render: (link) => (
      <span className="flex items-center gap-3">
        <FontAwesomeIcon
          icon={SOCIAL_ICONS[link.platform]}
          className="size-4 shrink-0 text-ink-400"
          aria-hidden
        />
        <span className="block">
          <span className="block font-medium text-ink-100">
            {link.label || SOCIAL_PLATFORM_LABELS[link.platform]}
          </span>
          {link.handle ? (
            <span className="block text-xs text-ink-500">@{link.handle}</span>
          ) : null}
        </span>
      </span>
    ),
  },
  { key: "url", label: "Ziel", render: (link) => <MutedCell>{displayHost(link.url) ?? link.url}</MutedCell> },
  {
    key: "sortOrder",
    label: "Reihenfolge",
    render: (link) => <MutedCell>{link.sortOrder}</MutedCell>,
  },
  { key: "active", label: "Sichtbar", render: (link) => <ActiveBadge active={link.active} /> },
];

export function SocialsManager({ initialItems }: { initialItems: SocialLinkDTO[] }) {
  return (
    <ResourceManager<SocialLinkDTO>
      endpoint="/api/admin/socials"
      initialItems={initialItems}
      columns={columns}
      singular="Social Link"
      plural="Social Links"
      emptyIcon={faShareNodes}
      emptyTitle="Noch keine Social Links vorhanden."
      emptyDescription="Hinterlege deine Kanäle – sie erscheinen dann im Footer und auf der Startseite."
      searchFields={(link) => `${link.platform} ${link.label ?? ""} ${link.handle ?? ""} ${link.url}`}
      hasActiveToggle
      hasSorting
      emptyValues={{
        platform: "twitch",
        label: "",
        handle: "",
        url: "",
        description: "",
        active: true,
        sortOrder: 0,
      }}
      toFormValues={(link) => ({
        platform: link.platform,
        label: link.label ?? "",
        handle: link.handle ?? "",
        url: link.url,
        description: link.description ?? "",
        active: link.active,
        sortOrder: link.sortOrder,
      })}
      fields={[
        {
          kind: "select",
          name: "platform",
          label: "Plattform",
          options: SOCIAL_PLATFORMS.map((platform) => ({
            value: platform,
            label: SOCIAL_PLATFORM_LABELS[platform],
          })),
          help: "Bestimmt das angezeigte Icon.",
        },
        { kind: "text", name: "label", label: "Anzeigename", help: "Leer lassen für den Standardnamen." },
        { kind: "url", name: "url", label: "URL", span: 2 },
        { kind: "text", name: "handle", label: "Handle", help: "Ohne @." },
        { kind: "number", name: "sortOrder", label: "Reihenfolge" },
        { kind: "text", name: "description", label: "Kurzbeschreibung", span: 2 },
        { kind: "switch", name: "active", label: "Öffentlich sichtbar", span: 2 },
      ]}
    />
  );
}
