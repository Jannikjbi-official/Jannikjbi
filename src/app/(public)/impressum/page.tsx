import type { Metadata } from "next";

import { LEGAL_ENTITY } from "@/lib/site";
import { getSiteSettings } from "@/server/content/settings";

export const metadata: Metadata = {
  title: "Impressum",
  description: "Impressum und Anbieterkennzeichnung.",
  alternates: { canonical: "/impressum" },
  robots: { index: true, follow: false },
};

/**
 * The only public page that carries the operator's full legal name and address.
 * These details are required here by §5 DDG and appear nowhere else on the site.
 */
export default async function ImpressumPage() {
  const settings = await getSiteSettings();

  return (
    <div className="py-14 sm:py-16 lg:py-20">
      <div className="container-page max-w-3xl">
        <h1 className="text-3xl font-bold sm:text-4xl">Impressum</h1>

        <div className="mt-10 space-y-10 text-[0.9375rem] leading-relaxed text-ink-300">
          <section>
            <h2 className="font-display text-lg font-semibold text-ink-100">
              Angaben gemäß § 5 DDG
            </h2>
            <address className="mt-4 not-italic">
              {LEGAL_ENTITY.name}
              <br />
              {LEGAL_ENTITY.street}
              <br />
              {LEGAL_ENTITY.postalCode} {LEGAL_ENTITY.city}
              <br />
              {LEGAL_ENTITY.country}
            </address>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink-100">Kontakt</h2>
            {settings.contact.email || settings.contact.businessEmail ? (
              <p className="mt-4">
                E-Mail:{" "}
                <a
                  href={`mailto:${settings.contact.email ?? settings.contact.businessEmail}`}
                  className="text-ink-100 underline underline-offset-4 transition-colors hover:text-gold-400"
                >
                  {settings.contact.email ?? settings.contact.businessEmail}
                </a>
              </p>
            ) : (
              <p className="mt-4">
                Eine Kontaktaufnahme ist über die auf dieser Website verlinkten
                Social-Media-Kanäle möglich.
              </p>
            )}
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink-100">
              Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
            </h2>
            <address className="mt-4 not-italic">
              {LEGAL_ENTITY.name}
              <br />
              {LEGAL_ENTITY.street}
              <br />
              {LEGAL_ENTITY.postalCode} {LEGAL_ENTITY.city}
            </address>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink-100">
              Verbraucherstreitbeilegung
            </h2>
            <p className="mt-4">
              Ich bin nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor
              einer Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink-100">
              Haftung für Links
            </h2>
            <p className="mt-4">
              Diese Website enthält Links zu externen Websites Dritter, auf deren Inhalte ich
              keinen Einfluss habe. Für diese fremden Inhalte ist stets der jeweilige Anbieter
              oder Betreiber der Seiten verantwortlich. Zum Zeitpunkt der Verlinkung waren
              keine Rechtsverstöße erkennbar. Bei Bekanntwerden von Rechtsverletzungen entferne
              ich derartige Links umgehend.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink-100">Urheberrecht</h2>
            <p className="mt-4">
              Die durch den Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten
              unterliegen dem deutschen Urheberrecht. Marken- und Bildrechte an genannten
              Spielen und Plattformen liegen bei den jeweiligen Rechteinhabern.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
