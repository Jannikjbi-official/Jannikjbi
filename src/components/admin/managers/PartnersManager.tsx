"use client";

import { faHandshake } from "@fortawesome/free-solid-svg-icons";

import type { PartnerDTO } from "@/lib/types";
import { displayHost } from "@/lib/utils";

import { ResourceManager, type Column } from "../ResourceManager";
import { ActiveBadge, FeaturedBadge, MutedCell } from "./cells";

const INTEGRATION_LABELS: Record<PartnerDTO["integration"], string> = {
  link: "Einfacher Partner-Block",
  "instant-gaming": "Instant Gaming Banner",
};

const columns: Column<PartnerDTO>[] = [
  {
    key: "name",
    label: "Partner",
    isRowHeader: true,
    render: (partner) => (
      <span className="block">
        <span className="block font-medium text-ink-100">{partner.name}</span>
        <span className="block text-xs text-ink-500">
          {partner.url ? displayHost(partner.url) : `/${partner.slug}`}
        </span>
      </span>
    ),
  },
  {
    key: "integration",
    label: "Integration",
    render: (partner) => <MutedCell>{INTEGRATION_LABELS[partner.integration]}</MutedCell>,
  },
  {
    key: "featured",
    label: "Featured",
    render: (partner) => <FeaturedBadge featured={partner.featured} />,
  },
  {
    key: "active",
    label: "Sichtbar",
    render: (partner) => <ActiveBadge active={partner.active} />,
  },
];

export function PartnersManager({ initialItems }: { initialItems: PartnerDTO[] }) {
  return (
    <ResourceManager<PartnerDTO>
      endpoint="/api/admin/partners"
      initialItems={initialItems}
      columns={columns}
      singular="Partner"
      plural="Partner"
      emptyIcon={faHandshake}
      emptyTitle="Noch keine Partner vorhanden."
      emptyDescription="Lege einen Partner an – er erscheint dann auf /partners."
      searchFields={(partner) => `${partner.name} ${partner.slug}`}
      hasActiveToggle
      hasSorting
      emptyValues={{
        name: "",
        slug: "",
        description: "",
        url: "",
        image: { url: "", alt: "" },
        integration: "link",
        affiliateId: "",
        disclosure: "",
        active: true,
        featured: false,
        sortOrder: 0,
      }}
      toFormValues={(partner) => ({
        name: partner.name,
        slug: partner.slug,
        description: partner.description ?? "",
        url: partner.url ?? "",
        image: { url: partner.image?.url ?? "", alt: partner.image?.alt ?? "" },
        integration: partner.integration,
        affiliateId: partner.affiliateId ?? "",
        disclosure: partner.disclosure ?? "",
        active: partner.active,
        featured: partner.featured,
        sortOrder: partner.sortOrder,
      })}
      fields={[
        { kind: "text", name: "name", label: "Name", required: true, placeholder: "Instant Gaming" },
        { kind: "slug", name: "slug", label: "Slug", from: "name" },
        { kind: "textarea", name: "description", label: "Beschreibung", rows: 4, span: 2 },
        { kind: "url", name: "url", label: "Partner-Link", span: 2 },
        { kind: "image", name: "image", label: "Logo", span: 2 },
        {
          kind: "select",
          name: "integration",
          label: "Integration",
          options: [
            { value: "link", label: INTEGRATION_LABELS.link },
            { value: "instant-gaming", label: INTEGRATION_LABELS["instant-gaming"] },
          ],
          help: "Das Instant-Gaming-Skript wird nur auf Seiten geladen, die ein Banner zeigen.",
        },
        {
          kind: "text",
          name: "affiliateId",
          label: "Affiliate-ID",
          help: 'Bei Instant Gaming der "igr"-Wert.',
        },
        {
          kind: "textarea",
          name: "disclosure",
          label: "Werbehinweis",
          rows: 2,
          span: 2,
          help: "Wird unter dem Partner-Block angezeigt.",
        },
        { kind: "number", name: "sortOrder", label: "Reihenfolge" },
        { kind: "switch", name: "active", label: "Öffentlich sichtbar" },
        { kind: "switch", name: "featured", label: "Auf der Startseite zeigen", span: 2 },
      ]}
    />
  );
}
