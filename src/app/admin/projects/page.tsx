import { PageHeading } from "@/components/admin/PageHeading";
import { ProjectsManager } from "@/components/admin/managers/ProjectsManager";
import { listAllProjects } from "@/server/content/projects";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
  const projects = await listAllProjects();

  return (
    <>
      <PageHeading
        title="Projekte"
        description="Deine eigenen Projekte. Als Featured markierte Projekte erscheinen auf der Startseite."
      />
      <ProjectsManager initialItems={projects} />
    </>
  );
}
