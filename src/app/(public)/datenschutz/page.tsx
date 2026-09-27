import type { Metadata } from "next";

import { INSTANT_GAMING, LEGAL_ENTITY } from "@/lib/site";
import { getSiteSettings } from "@/server/content/settings";

export const metadata: Metadata = {
  title: "Datenschutzerklärung",
  description: "Informationen zur Verarbeitung personenbezogener Daten auf dieser Website.",
  alternates: { canonical: "/datenschutz" },
  robots: { index: true, follow: false },
};

/**
 * Describes only what this codebase actually does. Nothing here claims a
 * processing activity that is not implemented:
 *  - no analytics, no tracking pixels, no advertising cookies
 *  - fonts are self-hosted by next/font, so no request reaches Google at runtime
 *  - OAuth and passkeys are only ever used for the private admin login
 */
export default async function DatenschutzPage() {
  const settings = await getSiteSettings();
  const contactEmail = settings.contact.email ?? settings.contact.businessEmail;

  return (
    <div className="py-14 sm:py-16 lg:py-20">
      <div className="container-page max-w-3xl">
        <h1 className="text-3xl font-bold sm:text-4xl">Datenschutzerklärung</h1>

        <div className="mt-10 space-y-10 text-[0.9375rem] leading-relaxed text-ink-300">
          <section>
            <h2 className="font-display text-lg font-semibold text-ink-100">
              1. Verantwortlicher
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
            {contactEmail ? (
              <p className="mt-3">
                E-Mail:{" "}
                <a
                  href={`mailto:${contactEmail}`}
                  className="text-ink-100 underline underline-offset-4 transition-colors hover:text-gold-400"
                >
                  {contactEmail}
                </a>
              </p>
            ) : null}
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink-100">
              2. Aufruf der Website (Server-Logfiles)
            </h2>
            <p className="mt-4">
              Beim Aufruf dieser Website werden durch den Hosting-Anbieter technisch
              notwendige Daten verarbeitet, insbesondere IP-Adresse, Datum und Uhrzeit des
              Zugriffs, aufgerufene Seite, übertragene Datenmenge, Referrer und
              Browser-/Betriebssystemangaben. Diese Verarbeitung ist für die Auslieferung der
              Seite und die Sicherheit des Systems erforderlich. Rechtsgrundlage ist Art. 6
              Abs. 1 lit. f DSGVO (berechtigtes Interesse am sicheren und stabilen Betrieb).
            </p>
            <p className="mt-3 rounded-lg border border-ink-700 bg-ink-880 p-4 text-sm text-ink-400">
              Hinweis an den Betreiber: Ergänze hier Name und Sitz deines Hosting-Anbieters
              sowie – falls einschlägig – den Hinweis auf einen Auftragsverarbeitungsvertrag
              und die konkrete Speicherdauer der Logfiles.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink-100">
              3. Keine Analyse, kein Tracking
            </h2>
            <p className="mt-4">
              Diese Website setzt keine Analyse-, Tracking- oder Werbe-Cookies ein. Es findet
              keine Reichweitenmessung und keine Profilbildung statt. Die verwendeten
              Schriftarten werden lokal vom eigenen Server ausgeliefert; beim Seitenaufruf
              wird dafür keine Verbindung zu Google aufgebaut.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink-100">
              4. Inhalte und Datenbank (MongoDB)
            </h2>
            <p className="mt-4">
              Die redaktionellen Inhalte dieser Website (Spiele, Genres, Streamplan, Projekte,
              Social-Links, Partner und Website-Einstellungen) werden in einer
              MongoDB-Datenbank gespeichert. Diese Inhalte enthalten keine personenbezogenen
              Daten von Besucherinnen und Besuchern. Der Zugriff auf die Datenbank erfolgt
              ausschließlich serverseitig.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink-100">
              5. Live-Status über die Twitch-API
            </h2>
            <p className="mt-4">
              Um anzuzeigen, ob gerade ein Stream läuft, fragt der Server dieser Website in
              regelmäßigen Abständen die offizielle Twitch-API ab. Diese Abfrage erfolgt
              serverseitig mit den Zugangsdaten des Website-Betreibers. Dabei werden{" "}
              <strong className="text-ink-200">keine</strong> Daten der Besucherinnen und
              Besucher an Twitch übermittelt – insbesondere nicht deren IP-Adresse. Ist die
              API nicht erreichbar, zeigt die Website ausschließlich den manuell gepflegten
              Streamplan an.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink-100">
              6. Instant Gaming (Partner-Banner)
            </h2>
            <p className="mt-4">
              Auf der Partner-Seite und ggf. auf der Startseite wird das offizielle
              Partner-Banner von Instant Gaming eingebunden. Dazu wird beim Aufruf dieser
              Seiten ein Skript von{" "}
              <span className="font-mono text-ink-200">instant-gaming.com</span> nachgeladen.
              Dabei wird Ihre IP-Adresse an den Anbieter übertragen; zudem kann der Anbieter
              eigene Cookies oder vergleichbare Technologien einsetzen. Das Skript wird nur
              auf den Seiten geladen, auf denen ein Banner tatsächlich dargestellt wird – nicht
              global auf der gesamten Website.
            </p>
            <p className="mt-3">
              Bei den Links zu Instant Gaming handelt es sich um Affiliate-Links mit der
              Partner-Kennung{" "}
              <span className="font-mono text-ink-200">{INSTANT_GAMING.affiliateId}</span>. Für
              Sie entstehen dadurch keine Mehrkosten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f
              DSGVO (berechtigtes Interesse an der Finanzierung des Angebots). Informationen
              zur Datenverarbeitung durch den Anbieter finden Sie in dessen eigener
              Datenschutzerklärung unter{" "}
              <a
                href="https://www.instant-gaming.com/de/page-privacy/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink-100 underline underline-offset-4 transition-colors hover:text-gold-400"
              >
                instant-gaming.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink-100">
              7. Links zu Social-Media-Kanälen
            </h2>
            <p className="mt-4">
              Die Social-Media-Symbole auf dieser Website sind einfache Hyperlinks, keine
              eingebetteten Plugins. Es werden keine Inhalte der jeweiligen Netzwerke geladen
              und keine Daten an diese übertragen, solange Sie den Link nicht anklicken. Erst
              nach dem Klick gelten die Datenschutzbestimmungen des jeweiligen Anbieters
              (u. a. Twitch, YouTube, Discord, Kick, Trovo, Ko-fi).
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink-100">
              8. Geschützter Administrationsbereich
            </h2>
            <p className="mt-4">
              Diese Website verfügt über einen nicht öffentlichen Verwaltungsbereich, der
              ausschließlich vom Betreiber genutzt wird. Eine öffentliche Registrierung
              besteht nicht. Für die Anmeldung kommt Better Auth zum Einsatz. Dabei werden
              verarbeitet:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5">
              <li>
                <strong className="text-ink-200">Sitzungs-Cookies:</strong> ein technisch
                notwendiges Cookie zur Aufrechterhaltung der Anmeldung.
              </li>
              <li>
                <strong className="text-ink-200">Discord- bzw. Twitch-Login (OAuth):</strong>{" "}
                bei der Anmeldung werden von der jeweiligen Plattform Benutzer-ID, Anzeigename,
                E-Mail-Adresse und Profilbild abgerufen und in der Datenbank gespeichert.
              </li>
              <li>
                <strong className="text-ink-200">Passkeys (WebAuthn):</strong> für die
                passwortlose Anmeldung werden öffentliche Schlüssel und Metadaten des
                Authentifikators gespeichert. Der private Schlüssel verlässt Ihr Gerät nicht.
              </li>
            </ul>
            <p className="mt-4">
              Diese Daten betreffen ausschließlich den Betreiber selbst und werden nicht zu
              Analysezwecken verwendet. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO
              (berechtigtes Interesse am Schutz des Verwaltungsbereichs).
            </p>
            <p className="mt-3">
              Sofern die optionale Better-Auth-Infrastruktur aktiviert ist, werden
              anmeldebezogene Ereignisse dieses Verwaltungsbereichs (z. B. Anmeldezeitpunkt und
              verwendete Methode) zusätzlich an den Dienst Better Auth übermittelt, um
              Sicherheits- und Aktivitätsprotokolle bereitzustellen. Besucherinnen und Besucher
              des öffentlichen Bereichs sind davon nicht betroffen.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink-100">
              9. Speicherdauer
            </h2>
            <p className="mt-4">
              Anmeldedaten und Sitzungen des Verwaltungsbereichs werden gelöscht, sobald sie
              für den genannten Zweck nicht mehr erforderlich sind – Sitzungen spätestens mit
              deren Ablauf. Redaktionelle Inhalte bleiben gespeichert, solange sie auf der
              Website veröffentlicht sind.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink-100">
              10. Ihre Rechte
            </h2>
            <p className="mt-4">
              Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16 DSGVO),
              Löschung (Art. 17 DSGVO), Einschränkung der Verarbeitung (Art. 18 DSGVO),
              Datenübertragbarkeit (Art. 20 DSGVO) sowie ein Widerspruchsrecht gegen
              Verarbeitungen auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO (Art. 21 DSGVO).
              Zudem steht Ihnen ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde zu.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
