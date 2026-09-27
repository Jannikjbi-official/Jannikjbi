import { PageHeading } from "@/components/admin/PageHeading";
import { SocialsManager } from "@/components/admin/managers/SocialsManager";
import { listAllSocialLinks } from "@/server/content/socials";

export const dynamic = "force-dynamic";

export default async function AdminSocialPage() {
  const links = await listAllSocialLinks();

  return (
    <>
      <PageHeading
        title="Social Media"
        description="Deine Kanäle. Deaktivierte Links verschwinden sofort aus Footer, Startseite und Über-mich."
      />
      <SocialsManager initialItems={links} />
    </>
  );
}
