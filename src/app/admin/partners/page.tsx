import { PageHeading } from "@/components/admin/PageHeading";
import { PartnersManager } from "@/components/admin/managers/PartnersManager";
import { listAllPartners } from "@/server/content/partners";

export const dynamic = "force-dynamic";

export default async function AdminPartnersPage() {
  const partners = await listAllPartners();

  return (
    <>
      <PageHeading
        title="Partner"
        description='Partner und Affiliate-Kooperationen. Mit der Integration "Instant Gaming" wird das offizielle Banner geladen.'
      />
      <PartnersManager initialItems={partners} />
    </>
  );
}
