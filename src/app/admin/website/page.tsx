import { PageHeading } from "@/components/admin/PageHeading";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { getSiteSettingsForAdmin } from "@/server/content/settings";

export const dynamic = "force-dynamic";

export default async function AdminWebsitePage() {
  const settings = await getSiteSettingsForAdmin();

  return (
    <>
      <PageHeading
        title="Website"
        description="Texte der Startseite, Footer und welche Abschnitte angezeigt werden."
      />

      <SettingsForm
        initialValues={{
          creatorName: settings.creatorName,
          tagline: settings.tagline,
          heroHeadline: settings.heroHeadline,
          heroSubline: settings.heroSubline,
          heroText: settings.heroText,
          footerText: settings.footerText,
          "sections.games": settings.sections.games,
          "sections.stream": settings.sections.stream,
          "sections.projects": settings.sections.projects,
          "sections.socials": settings.sections.socials,
          "sections.partners": settings.sections.partners,
        }}
        fields={[
          {
            kind: "text",
            name: "creatorName",
            label: "Creator-Name",
            help: "Erscheint im Header, Footer und in den Metadaten.",
          },
          { kind: "text", name: "tagline", label: "Claim", help: "Gaming · Content · Projekte" },
          { kind: "text", name: "heroHeadline", label: "Hero-Überschrift", span: 2 },
          { kind: "text", name: "heroSubline", label: "Hero-Unterzeile", span: 2 },
          { kind: "textarea", name: "heroText", label: "Hero-Text", rows: 4, span: 2 },
          { kind: "text", name: "footerText", label: "Footer-Text", span: 2 },
          { kind: "switch", name: "sections.games", label: "Abschnitt „Games“ zeigen" },
          { kind: "switch", name: "sections.stream", label: "Abschnitt „Nächster Stream“ zeigen" },
          { kind: "switch", name: "sections.projects", label: "Abschnitt „Projekte“ zeigen" },
          { kind: "switch", name: "sections.socials", label: "Abschnitt „Social Media“ zeigen" },
          { kind: "switch", name: "sections.partners", label: "Abschnitt „Partner“ zeigen" },
        ]}
      />
    </>
  );
}
