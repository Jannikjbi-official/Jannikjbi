import { PageHeading } from "@/components/admin/PageHeading";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { getSiteSettingsForAdmin } from "@/server/content/settings";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettingsForAdmin();

  return (
    <>
      <PageHeading
        title="Settings"
        description="SEO, Social Preview, Akzentfarbe und die Twitch-Anbindung."
      />

      <SettingsForm
        initialValues={{
          siteTitle: settings.siteTitle,
          description: settings.description,
          "seo.metaTitle": settings.seo.metaTitle ?? "",
          "seo.metaDescription": settings.seo.metaDescription ?? "",
          "seo.canonicalUrl": settings.seo.canonicalUrl ?? "",
          "seo.ogImage": settings.seo.ogImage ?? "",
          "seo.keywords": settings.seo.keywords,
          accentColor: settings.accentColor,
          twitchLogin: settings.twitchLogin ?? "",
        }}
        fields={[
          { kind: "text", name: "siteTitle", label: "Website-Titel", span: 2 },
          {
            kind: "textarea",
            name: "description",
            label: "Beschreibung",
            rows: 3,
            span: 2,
            help: "Wird als Meta-Description verwendet, wenn unten nichts steht.",
          },
          { kind: "text", name: "seo.metaTitle", label: "SEO-Titel", span: 2 },
          { kind: "textarea", name: "seo.metaDescription", label: "SEO-Beschreibung", rows: 3, span: 2 },
          {
            kind: "url",
            name: "seo.canonicalUrl",
            label: "Canonical-URL",
            help: "z. B. https://jannikjbi.de",
          },
          {
            kind: "url",
            name: "seo.ogImage",
            label: "Social-Preview-Bild",
            help: "Wird beim Teilen angezeigt.",
          },
          {
            kind: "tags",
            name: "seo.keywords",
            label: "Keywords",
            span: 2,
            placeholder: "Gaming, Streaming, Simulation",
          },
          {
            kind: "color",
            name: "accentColor",
            label: "Akzentfarbe",
            help: "Standard ist #ffc61a.",
          },
          {
            kind: "text",
            name: "twitchLogin",
            label: "Twitch-Kanal",
            help: "Kanalname für den Live-Status, ohne twitch.tv/.",
          },
        ]}
      />
    </>
  );
}
