# CLAUDE.md

Arbeitsanweisungen für Claude Code in diesem Repository.
Sprache im Gespräch mit dem Betreiber: **Deutsch**. Code, Kommentare und
Commit-Botschaften: **Englisch** für Code/Kommentare, **Deutsch** für
Commit-Botschaften und alle Texte, die auf der Website erscheinen.

---

## Was das hier ist

Die offizielle Website von **Jannikjbi** (jannikjbi.de) mit privatem
Content-CMS und einer Anbindung an das **Creator Buddy Dashboard** in Notion.

```
Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4
HeroUI v3 · Font Awesome 7 · MongoDB (Mongoose) · Better Auth
```

Live auf Vercel: Team `voltfm`, Projekt `jannikjbi-de`, Branch `main`,
Region `fra1`. Erreichbar unter `www.jannikjbi.de`; der Apex `jannikjbi.de`
leitet per 308 dorthin.

---

## Vor jedem Push

```bash
npm run typecheck   # muss fehlerfrei sein
npm run lint        # muss 0 Probleme melden
npm test            # Notion-Mapping-Tests, müssen grün sein
npm run build       # muss mit Exit 0 durchlaufen
```

Erst wenn alle vier sauber sind, committen und pushen. Immer auf **beide**
Branches pushen:

```bash
git push origin HEAD:main HEAD:dev/beautiful-pascal-ma4doz
```

Ein Deployment entsteht nicht automatisch — nach dem Push das Production-Deploy
aus `main` anstoßen (Vercel-MCP `create_deployment`, target `production`).

---

## Harte Regeln

Diese stammen aus dem ursprünglichen Auftrag und gelten weiter.

**Keine erfundenen Daten.** Keine Followerzahlen, Zuschauerzahlen, Bewertungen,
Statistiken, Partnerschaften oder Streamzeiten. Gibt es keine Daten, wird der
Bereich nicht angezeigt oder zeigt einen Leerzustand. Das gilt auch beim
Notion-Import: Eine Zeile ohne Datum wird mit Begründung übersprungen, statt
ein Datum zu raten.

**Nichts hardcoden, was ins CMS gehört.** Games, Genres, Streams, Projekte,
Social Links, Partner, About-Text und Website-Einstellungen kommen aus MongoDB.

**Icons nur von Font Awesome.** Keine Lucide, keine anderen Bibliotheken, keine
Emojis als UI-Icons. Offizielle Brand-Icons verwenden, wo es sie gibt. Kick und
Trovo haben im freien Set keins und bekommen ein neutrales Solid-Icon — das
Kickstarter-Icon ist eine andere Marke und wird **nicht** ersatzweise genutzt.

**Sicherheit ist serverseitig.** Siehe unten. Die Client-Seite ist nie die
einzige Barriere.

**Rechtliche Angaben nur dort, wo sie hingehören.** Der volle Name und die
Anschrift erscheinen ausschließlich auf `/impressum` und `/datenschutz` — nie im
Header, Hero, Footer oder auf Inhaltsseiten.

**Datenschutz beschreibt nur, was der Code wirklich tut.** Keine Behauptungen
über Verarbeitungen, die nicht implementiert sind. Externe Links vor dem
Eintragen prüfen, nicht raten.

---

## Architektur

```
src/
├── app/
│   ├── (public)/            öffentliche Seiten, eigenes Layout
│   ├── admin/               CMS, serverseitig geschützt
│   ├── api/admin/           geschützte CRUD- und Notion-APIs
│   ├── api/auth/[...all]/   Better Auth
│   ├── api/cron/            geplanter Notion-Sync
│   └── not-found.tsx        404 – zugleich die "Unauthorized"-Erfahrung
├── components/              UI – hier gibt es KEINEN @/server-Import
├── lib/                     geteilte Konstanten, Typen, Validierung, Utils
├── scripts/seed.ts          CLI-Wrapper um den Seed
└── server/                  ausschließlich serverseitig
    ├── auth/                Better Auth, Autorisierung, verknüpfte Konten
    ├── content/             Datenzugriff je Ressource + Seed-Inhalte
    ├── db/                  Mongoose-Verbindung
    ├── models/              Schemas
    ├── notion/              Creator-Buddy-Client, Mapping, Sync, Verwaltung
    └── api/                 Response-Helfer, CRUD-Factory
```

**Die Grenze `components/` ↔ `server/` ist hart.** In `src/components` darf
kein `@/server`-Import stehen, sonst landen Mongoose oder ein Secret im
Browser-Bundle. Geteilte Konstanten gehören nach `src/lib/content-constants.ts`
bzw. `src/lib/notion-manage-types.ts`.

---

## Sicherheitsmodell

Zentral in `src/server/auth/authorization.ts`, bei **jedem** Request neu gegen
die Datenbank geprüft — nie gegen einen Wert aus dem Browser, einen
Cookie-Claim oder das Session-Objekt allein.

Drei Wege, in dieser Reihenfolge:

1. `ADMIN_USER_IDS` – Better-Auth-User-IDs. Primär und am stabilsten, weil die
   User-ID beim Verknüpfen oder Lösen von Anmeldemethoden gleich bleibt.
2. `ADMIN_DISCORD_ID` – Discord-Account-ID, nur noch für die erste Anmeldung.
3. `ADMIN_TWITCH_IDS` – ausdrücklich freigegebene Twitch-Account-IDs.

**Jeder Fehlschlag endet gleich:** `null` → 404 mit der normalen 404-Seite.
Nichts verrät, dass ein CMS existiert, wer Zugriff hat oder ob ein Konto
existiert. Diese Eigenschaft beim Ändern von Auth-Code nicht aufweichen.

Geschützte Routen liefern bei **jeder** HTTP-Methode 404 — auch bei solchen,
die es nicht gibt. Sonst verrät ein 405, dass der Pfad existiert. Siehe
`src/app/api/admin/seed/route.ts`.

---

## Creator Buddy (Notion)

Zwei getrennte Bereiche im CMS:

| Seite | Zweck |
| --- | --- |
| `/admin/creator-buddy` | Notion **direkt bearbeiten** – Content, Kanäle, Sponsoren, Aufgaben |
| `/admin/notion` | **Synchronisierung** mit der Website und Datenbank-IDs |

Die Verwaltung ist **schema-getrieben**: `src/server/notion/manage.ts` liest das
Notion-Schema zur Laufzeit und die UI rendert Tabelle und Formular daraus. Eine
in Notion ergänzte Eigenschaft erscheint dadurch ohne Codeänderung. Beim
Erweitern diesen Ansatz beibehalten, statt Felder fest zu verdrahten.

Der Sync (`src/server/notion/sync.ts`) bildet ab:

| Creator Buddy | Website | Richtung |
| --- | --- | --- |
| Kanäle | Social Links | Notion → Website |
| Content DB (`Typ = Stream`) | Streamplan | beide Richtungen |
| Sponsoren | Partner | Notion → Website |

Regeln, die nicht aufgeweicht werden dürfen: Zeilen ohne
Veröffentlichungsdatum werden mit Begründung übersprungen; `Idee = true` und
Status `In Wartestellung` landen nicht im öffentlichen Plan; importierte
Sponsoren bleiben deaktiviert, bis sie im CMS freigegeben werden.

Die Notion-Integration heißt **„Web"**. Sieht sie nichts, ist die Seite
„Creator Buddy Dashboard" nicht über **⋯ → Verbindungen** mit ihr geteilt.

---

## Design

Dunkel, ruhig, **eine** Akzentfarbe (Gold `#ffc61a`), gezielt für CTAs, aktive
Zustände und Kennzahlen. Space Grotesk für Überschriften, Plus Jakarta Sans für
Fließtext, beide lokal über `next/font`.

HeroUI v3 liefert die technische Basis; das Theme wird in
`src/app/globals.css` über CSS-Variablen überschrieben, damit die Seite **nicht**
wie eine HeroUI-Demo aussieht. Keine Neon-Explosionen, kein Glassmorphism
überall, keine übertriebenen Animationen. `prefers-reduced-motion` schaltet
Animationen global ab.

Für Navigation `ButtonLink` (`src/components/ui/ButtonLink.tsx`) verwenden: Er
nutzt HeroUIs `buttonVariants`, rendert aber ein echtes `<a>`.

Das VTuber-Modell erscheint **nur** auf der 404-Seite. Im Footer wurde es
bewusst entfernt.

---

## Stolpersteine

**Mongoose 9** heißt der Filtertyp `QueryFilter`, nicht `FilterQuery`.

**React Compiler** verbietet synchrones `setState` im Effect-Body. Daten beim
Mount laden: kein `setState` vor dem `await`; die Regel nur punktuell und mit
Begründung deaktivieren.

**`NEXT_PUBLIC_*`** wird zur Build-Zeit eingebacken. Änderungen greifen erst
nach einem neuen Deployment.

**`BETTER_AUTH_URL`** muss exakt die Origin sein, die der Browser sieht. Weil
der Apex auf `www` weiterleitet, steht dort `https://www.jannikjbi.de`. Daraus
leitet sich auch die Passkey-Bindung (`rpID`) ab: Ein auf `www` angelegter
Passkey gilt **nicht** für die Apex-Domain.

**OAuth-Redirect-URLs** müssen exakt lauten:
`<BETTER_AUTH_URL>/api/auth/callback/discord` bzw. `.../twitch`. Nur die
Startseite einzutragen führt zu `redirect_mismatch`.

**Diese Sandbox erreicht MongoDB Atlas nicht** (Netzwerk-Policy). Vercel schon.
Den Seed deshalb über den geschützten Endpunkt fahren, nicht über die CLI:
`SEED_SECRET` setzen, `POST /api/admin/seed` mit
`Authorization: Bearer <SEED_SECRET>`, danach das Secret wieder leeren.

**Öffentliche Datenzugriffe** laufen über `safeRead` in
`src/server/content/db.ts`: Bei einem Datenbankfehler wird geloggt und ein
Leerzustand gerendert, statt eine Fehlerseite zu zeigen. Admin-Lesezugriffe und
alle Schreibzugriffe nutzen das bewusst **nicht**.

---

## Secrets

Nie ins Repository. Alles über Vercel → Projekt `jannikjbi-de` → Settings →
Environment Variables. Lokal in `.env.local` (gitignored), Vorlage in
`.env.example`.

Kommen Zugangsdaten im Chat an, nach der Einrichtung zur Rotation raten — sie
stehen dann im Verlauf.

---

## Offen

- Aufbewahrungsdauer der Zugriffs-Logs in `/datenschutz` ergänzen.
- Media-Bibliothek: Bilder sind aktuell URL plus Alt-Text. Das Feld ist bereits
  ein eingebettetes Objekt, ein Upload-Dienst lässt sich ohne Migration
  ergänzen.
