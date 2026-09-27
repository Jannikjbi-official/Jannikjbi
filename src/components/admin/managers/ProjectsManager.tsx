"use client";

import { faDiagramProject } from "@fortawesome/free-solid-svg-icons";

import { PROJECT_STATUSES, PROJECT_STATUS_LABELS } from "@/lib/content-constants";
import type { ProjectDTO } from "@/lib/types";
import { ProjectStatusChip } from "@/components/ui/StatusChip";
import { displayHost } from "@/lib/utils";

import { ResourceManager, type Column } from "../ResourceManager";
import { ActiveBadge, FeaturedBadge, MutedCell } from "./cells";

const columns: Column<ProjectDTO>[] = [
  {
    key: "name",
    label: "Projekt",
    isRowHeader: true,
    render: (project) => (
      <span className="block">
        <span className="block font-medium text-ink-100">{project.name}</span>
        <span className="block text-xs text-ink-500">
          {project.url ? displayHost(project.url) : `/${project.slug}`}
        </span>
      </span>
    ),
  },
  {
    key: "category",
    label: "Kategorie",
    render: (project) => <MutedCell>{project.category ?? "–"}</MutedCell>,
  },
  {
    key: "status",
    label: "Status",
    render: (project) => <ProjectStatusChip status={project.status} />,
  },
  {
    key: "featured",
    label: "Featured",
    render: (project) => <FeaturedBadge featured={project.featured} />,
  },
  {
    key: "active",
    label: "Sichtbar",
    render: (project) => <ActiveBadge active={project.active} />,
  },
];

export function ProjectsManager({ initialItems }: { initialItems: ProjectDTO[] }) {
  return (
    <ResourceManager<ProjectDTO>
      endpoint="/api/admin/projects"
      initialItems={initialItems}
      columns={columns}
      singular="Projekt"
      plural="Projekte"
      emptyIcon={faDiagramProject}
      emptyTitle="Noch keine Projekte vorhanden."
      emptyDescription="Lege dein erstes Projekt an – es erscheint dann auf /projects."
      searchFields={(project) => `${project.name} ${project.slug} ${project.category ?? ""}`}
      hasActiveToggle
      hasSorting
      emptyValues={{
        name: "",
        slug: "",
        tagline: "",
        description: "",
        image: { url: "", alt: "" },
        category: "",
        url: "",
        status: "live",
        active: true,
        featured: false,
        sortOrder: 0,
      }}
      toFormValues={(project) => ({
        name: project.name,
        slug: project.slug,
        tagline: project.tagline ?? "",
        description: project.description,
        image: { url: project.image?.url ?? "", alt: project.image?.alt ?? "" },
        category: project.category ?? "",
        url: project.url ?? "",
        status: project.status,
        active: project.active,
        featured: project.featured,
        sortOrder: project.sortOrder,
      })}
      fields={[
        { kind: "text", name: "name", label: "Name", required: true, placeholder: "VoltFM" },
        { kind: "slug", name: "slug", label: "Slug", from: "name" },
        { kind: "text", name: "tagline", label: "Kurzbeschreibung", span: 2 },
        { kind: "textarea", name: "description", label: "Beschreibung", rows: 5, required: true, span: 2 },
        { kind: "image", name: "image", label: "Projektbild", span: 2 },
        { kind: "text", name: "category", label: "Kategorie", placeholder: "Webradio" },
        { kind: "url", name: "url", label: "Website" },
        {
          kind: "select",
          name: "status",
          label: "Status",
          options: PROJECT_STATUSES.map((status) => ({
            value: status,
            label: PROJECT_STATUS_LABELS[status],
          })),
        },
        { kind: "number", name: "sortOrder", label: "Reihenfolge" },
        { kind: "switch", name: "active", label: "Öffentlich sichtbar" },
        { kind: "switch", name: "featured", label: "Auf der Startseite zeigen" },
      ]}
    />
  );
}
