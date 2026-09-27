import { PageHeading } from "@/components/admin/PageHeading";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { getSiteSettingsForAdmin } from "@/server/content/settings";

export const dynamic = "force-dynamic";

export default async function AdminAboutPage() {
  const settings = await getSiteSettingsForAdmin();

  return (
    <>
      <PageHeading
        title="Über mich"
        description="Der Text auf /about. Leerzeilen trennen Absätze."
      />

      <SettingsForm
        initialValues={{
          aboutHeadline: settings.aboutHeadline,
          aboutText: settings.aboutText,
          "contact.email": settings.contact.email ?? "",
          "contact.businessEmail": settings.contact.businessEmail ?? "",
          "contact.note": settings.contact.note ?? "",
        }}
        fields={[
          { kind: "text", name: "aboutHeadline", label: "Überschrift", span: 2 },
          {
            kind: "textarea",
            name: "aboutText",
            label: "Über-mich-Text",
            rows: 10,
            span: 2,
            help: "Eine Leerzeile beginnt einen neuen Absatz.",
          },
          {
            kind: "text",
            name: "contact.businessEmail",
            label: "Business-E-Mail",
            help: "Optional – erscheint auf /about.",
          },
          { kind: "text", name: "contact.email", label: "Allgemeine E-Mail" },
          {
            kind: "textarea",
            name: "contact.note",
            label: "Hinweis zum Kontakt",
            rows: 2,
            span: 2,
          },
        ]}
      />
    </>
  );
}
