import type { Metadata } from "next";
import { faDiagramProject } from "@fortawesome/free-solid-svg-icons";

import { ProjectCard } from "@/components/home/ProjectCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { listPublicProjects } from "@/server/content/projects";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Projekte",
  description: "Meine eigenen digitalen Projekte neben Gaming und Content.",
  alternates: { canonical: "/projects" },
};

export default async function ProjectsPage() {
  const projects = await listPublicProjects();

  return (
    <div className="py-14 sm:py-16 lg:py-20">
      <div className="container-page">
        <header className="mb-10 max-w-2xl">
          <p className="eyebrow mb-3">Eigene Arbeiten</p>
          <h1 className="text-3xl font-bold sm:text-4xl lg:text-[2.75rem]">Projekte</h1>
          <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-300">
            Neben dem Content entstehen eigene digitale Projekte – von Webradio bis zu
            eigenen Webseiten.
          </p>
        </header>

        {projects.length === 0 ? (
          <EmptyState
            icon={faDiagramProject}
            title="Noch keine Projekte vorhanden."
            description="Projekte lassen sich im Dashboard anlegen und erscheinen dann hier."
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
