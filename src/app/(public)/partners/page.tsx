import type { Metadata } from "next";
import { faHandshake } from "@fortawesome/free-solid-svg-icons";

import { PartnerHighlight } from "@/components/partners/PartnerHighlight";
import { EmptyState } from "@/components/ui/EmptyState";
import { listPublicPartners } from "@/server/content/partners";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Partner",
  description: "Meine Partner und Affiliate-Kooperationen.",
  alternates: { canonical: "/partners" },
};

export default async function PartnersPage() {
  const partners = await listPublicPartners();

  return (
    <div className="py-14 sm:py-16 lg:py-20">
      <div className="container-page">
        <header className="mb-10 max-w-2xl">
          <p className="eyebrow mb-3">Kooperationen</p>
          <h1 className="text-3xl font-bold sm:text-4xl lg:text-[2.75rem]">Partner</h1>
          <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-300">
            Partner, mit denen ich zusammenarbeite. Affiliate-Links sind als solche
            gekennzeichnet – für dich ändert sich am Preis nichts.
          </p>
        </header>

        {partners.length === 0 ? (
          <EmptyState
            icon={faHandshake}
            title="Noch keine Partner vorhanden."
            description="Partner lassen sich im Dashboard anlegen und erscheinen dann hier."
          />
        ) : (
          <div className="space-y-8">
            {partners.map((partner) => (
              <section key={partner.id} aria-labelledby={`partner-${partner.slug}`}>
                <h2
                  id={`partner-${partner.slug}`}
                  className="mb-4 font-display text-xl font-semibold text-ink-100"
                >
                  {partner.name}
                </h2>
                <PartnerHighlight partner={partner} />
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
