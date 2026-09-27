# jannikjbi.de

Die offizielle Website von **Jannikjbi** – Gaming, Streaming, Content und eigene
digitale Projekte – mit integriertem privatem Content-CMS und einer Anbindung an
das **Creator Buddy Dashboard** in Notion.

```
Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4
HeroUI v3 · Font Awesome 7 · MongoDB (Mongoose) · Better Auth
```

---

## Inhaltsverzeichnis

1. [Schnellstart](#schnellstart)
2. [Environment-Variablen](#environment-variablen)
3. [Routen](#routen)
4. [Architektur](#architektur)
5. [Sicherheitsmodell](#sicherheitsmodell)
6. [Creator Buddy (Notion)](#creator-buddy-notion)
7. [Das VTuber-Modell](#das-vtuber-modell)
8. [Design-System](#design-system)
9. [Deployment](#deployment)
10. [Offene Punkte](#offene-punkte)

---

## Schnellstart

```bash
npm install
cp .env.example .env.local     # ausfüllen, siehe unten
npm run seed                   # Startinhalte anlegen (idempotent)
npm run dev
```

| Befehl | Zweck |
| --- | --- |
| `npm run dev` | Entwicklungsserver |
| `npm run build` | Produktions-Build |
| `npm run start` | Produktionsserver |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript ohne Emit |
| `npm test` | Unit-Tests (Notion-Mapping) |
| `npm run seed` | Startinhalte in MongoDB anlegen |

`npm run seed` legt Genres, zwei Spiele, VoltFM, die Social-Links, den
Instant-Gaming-Partner und die Website-Einstellungen an. Es arbeitet mit
`$setOnInsert`, überschreibt also nichts, was du im CMS geändert hast.

---

## Environment-Variablen

Alles Nötige steht kommentiert in [`.env.example`](.env.example). Das Minimum
für einen lauffähigen Start:

| Variable | Pflicht | Zweck |
| --- | --- | --- |
| `MONGODB_URI` | ja | Verbindung zu MongoDB |
| `MONGODB_DB` | nein | Datenbankname, falls nicht in der URI |
| `BETTER_AUTH_SECRET` | für Login | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | für Login | Öffentliche Origin ohne Slash |
| `DISCORD_CLIENT_ID` / `_SECRET` | für Login | Discord OAuth |
| `TWITCH_CLIENT_ID` / `_SECRET` | nein | Twitch OAuth **und** Live-Status |
| `ADMIN_DISCORD_ID` | nein | Standard: die autorisierte Discord-ID |
| `BETTER_AUTH_API_KEY` | nein | Better Auth Infrastructure (`dash()`) |
| `NOTION_TOKEN` | nein | Creator-Buddy-Sync |
| `CRON_SECRET` | nein | Geplanter Notion-Sync |

Fehlt eine optionale Variable, bleibt die Website funktionsfähig – die
betroffene Funktion ist dann schlicht inaktiv. Ohne `TWITCH_CLIENT_ID` etwa
zeigt die Seite statt des Live-Status den manuellen Streamplan.

**OAuth-Redirect-URLs**

```
<BETTER_AUTH_URL>/api/auth/callback/discord
<BETTER_AUTH_URL>/api/auth/callback/twitch
```

---

## Routen

**Öffentlich**

| Route | Inhalt |
| --- | --- |
| `/` | Hero, aktuelle Games, nächster Stream, Projekte, Socials, Partner |
| `/games` | Alle Spiele mit Suche, Genre-, Status-Filter und Sortierung |
| `/games/[slug]` | Detailseite je Spiel |
| `/content` | Streamplan inkl. Twitch-Live-Status |
| `/projects` | Eigene Projekte |
| `/about` | Über mich |
| `/partners` | Partner inkl. offiziellem Instant-Gaming-Banner |
| `/impressum`, `/datenschutz` | Rechtliches |

**Privat**

| Route | Inhalt |
| --- | --- |
| `/login` | Passkey, Discord, Twitch – nicht öffentlich verlinkt |
| `/admin` | Dashboard mit Live-Zahlen aus MongoDB |
| `/admin/games`, `/genres`, `/streams`, `/projects`, `/social`, `/partners` | CRUD |
| `/admin/notion` | Creator-Buddy-Anbindung |
| `/admin/about`, `/website`, `/settings` | Texte, Startseite, SEO |

Alle `/admin`- und `/api/admin`-Routen antworten Unbefugten mit **404**.

---

## Architektur

```
src/
├── app/
│   ├── (public)/            öffentliche Seiten (eigenes Layout)
│   ├── admin/               CMS, serverseitig geschützt
│   ├── api/admin/           geschützte CRUD-APIs
│   ├── api/auth/[...all]/   Better Auth
│   ├── api/cron/            geplanter Notion-Sync
│   ├── not-found.tsx        404 – auch die "Unauthorized"-Erfahrung
│   └── globals.css          Design-Tokens
├── components/              UI, ohne jeden Server-Import
├── lib/                     geteilte Konstanten, Typen, Validierung, Utils
├── scripts/seed.ts
└── server/                  nur serverseitig
    ├── auth/                Better Auth + Autorisierung
    ├── content/             Datenzugriff je Ressource
    ├── db/                  Mongoose-Verbindung
    ├── models/              Schemas
    ├── notion/              Creator-Buddy-Integration
    └── api/                 Response-Helfer, CRUD-Factory
```

Die Grenze zwischen `components/` und `server/` ist bewusst hart: In
`src/components` existiert kein einziger `@/server`-Import, damit weder Mongoose
noch ein Secret je im Browser-Bundle landen kann. Geteilte Konstanten wohnen
deshalb in `src/lib/content-constants.ts`.

**Datenfluss einer CMS-Änderung**

```
Formular (HeroUI)
  → POST/PATCH /api/admin/<resource>
    → requireAdminApi()          Autorisierung gegen die Datenbank
    → Zod-Validierung
    → Mongoose
    → revalidatePath()           betroffene öffentliche Seiten
  → Toast + router.refresh()
```

Dadurch erscheint ein neues Spiel sofort auf `/games`, ohne Deploy.

---

## Sicherheitsmodell

Autorisiert ist **genau eine Identität**: der Discord-Account
`1276986070675882006` (überschreibbar per `ADMIN_DISCORD_ID`).

Die Prüfung liegt zentral in
[`src/server/auth/authorization.ts`](src/server/auth/authorization.ts) und
läuft bei **jedem** Request neu gegen die `account`-Collection – nie gegen einen
Wert aus dem Browser, einem Cookie-Claim oder dem Session-Objekt allein:

```
Browser → Next.js Route → Better Auth Session
        → getAdminIdentity()   Discord-Account-ID aus der Datenbank
        → API-Guard            requireAdminApi()
        → MongoDB
```

* **Discord** – Zugriff nur bei exakt passender Account-ID.
* **Twitch** – gewährt nur Zugriff, wenn der Account mit dem autorisierten
  Discord-Benutzer verknüpft ist (Account-Linking) oder explizit in
  `ADMIN_TWITCH_IDS` steht. Die Anmeldemethode ersetzt nie die Autorisierung.
* **Passkey** – hängt am Benutzer; eine unbekannte Identität erhält nichts.
* **Öffentliche Registrierung** existiert nicht (`emailAndPassword` ist aus).

Jeder Fehlerfall – keine Session, gesperrter Benutzer, falscher Account,
Datenbankfehler – endet im selben Ergebnis: `null`, und damit ein **404** mit
der normalen Website-404-Seite. Nach außen ist nicht unterscheidbar, ob eine
Seite fehlt oder ob jemand nur nicht berechtigt ist. Es gibt keine Meldung wie
„Du bist nicht berechtigt“, keinen Hinweis auf die autorisierte ID und keinen
Hinweis darauf, dass es ein CMS überhaupt gibt.

Weiteres: Zod-Validierung auf jedem Endpunkt, Slug-Prüfung, nur `http(s)`-URLs
werden je als Link gerendert, `noindex` plus `no-store` auf allen privaten
Routen, generische 500er ohne Stacktrace, und keine Mongo-Verbindung im Client.

---

## Creator Buddy (Notion)

Die Anbindung an dein **Creator Buddy Dashboard 1.1.1** wird unter
`/admin/notion` gesteuert.

### Abbildung

| Creator Buddy | Website | Richtungen |
| --- | --- | --- |
| **Kanäle** (Name, Plattform, URL) | Social Links | Notion → Website |
| **Content DB**, `Typ = Stream` | Streamplan | beide Richtungen |
| **Sponsoren** (Sponsor) | Partner | Notion → Website |

Pro Bereich wählst du die Richtung: `Aus`, `Notion → Website` (Notion führt)
oder `Website → Notion` (das CMS führt und schreibt nach Notion). Zuordnung
läuft über die gespeicherte Notion-Page-ID, ein Abgleich erzeugt also keine
Duplikate. Social-Links, die vor dem ersten Sync von Hand angelegt wurden,
werden anhand ihrer URL übernommen statt verdoppelt.

### Regeln, die bewusst nichts erfinden

* Eine Content-Zeile **ohne Veröffentlichungsdatum** wird übersprungen und im
  Ergebnisbericht mit Grund aufgeführt – es wird kein Datum geraten.
* Enthält das Datum keine Uhrzeit, wird `19:00` gesetzt; im CMS korrigierbar.
* `Idee = true` und Status `In Wartestellung` landen **nicht** im öffentlichen
  Plan (angelegt, aber deaktiviert).
* Importierte **Sponsoren sind deaktiviert**, bis du sie im CMS freigibst – eine
  Geschäftsbeziehung geht nie versehentlich live.
* Die Plattform eines Streams kommt aus dem verknüpften Kanal.

### Einrichtung

1. Auf <https://www.notion.so/my-integrations> eine **interne Integration**
   anlegen und das Secret als `NOTION_TOKEN` hinterlegen.
2. In Notion die Seite „Creator Buddy Dashboard“ über **⋯ → Verbindungen** mit
   der Integration teilen (vererbt sich auf alle Unterdatenbanken).
3. Unter `/admin/notion` die drei Datenbank-IDs einfügen – ein kopierter
   Notion-Link genügt – Richtung wählen, speichern.
4. Der Status je Datenbank zeigt an, ob die Verbindung steht.

### Geplanter Abgleich

`CRON_SECRET` setzen und `GET /api/cron/notion-sync` regelmäßig aufrufen.
Beispiel für `vercel.json`:

```json
{ "crons": [{ "path": "/api/cron/notion-sync", "schedule": "0 * * * *" }] }
```

Ohne `CRON_SECRET` antwortet die Route mit 404, wie jeder andere private
Endpunkt. Der Vergleich des Secrets läuft in konstanter Zeit.

---

## Das VTuber-Modell

Das Modell liegt unter `public/brand/jannikjbi-vtuber.webp` (941 × 1672, mit
Alphakanal). Es wird **nicht** als Card oder normales Bild gezeigt, sondern
sitzt auf der Oberkante des Footers:

```css
.vtuber-perch {
  position: absolute;
  bottom: calc(100% - var(--vtuber-sink)); /* Füße unter die Kante */
  height: var(--vtuber-height);
}
```

`bottom: calc(100% - sink)` setzt die Füße um `--vtuber-sink` **unter** die
Footer-Oberkante: Der Körper ragt darüber hinaus, die Beine hängen in den
Footer hinein. Ein `.vtuber-spacer` reserviert genau den überstehenden Teil, so
dass der Abschnitt darüber nie verdeckt wird.

| Breakpoint | Höhe | Eintauchtiefe |
| --- | --- | --- |
| Mobile | 168 px | 62 px |
| ≥ 640 px | 232 px | 84 px |
| ≥ 1024 px | 330 px | 118 px |
| ≥ 1280 px | 390 px | 138 px |

`pointer-events: none` stellt sicher, dass das Modell nie einen Klick auf die
Footer-Navigation abfängt; `overflow-x: clip` auf `body` verhindert jede
horizontale Scrollbar. Die Transparenz bleibt erhalten – kein künstlicher
Hintergrund. Auf der 404-Seite steht dieselbe, unveränderte Grafik neben der
großen „404“.

---

## Design-System

Dunkel, ruhig, mit **einer** Akzentfarbe (Gold `#ffc61a`), die gezielt für CTAs,
aktive Zustände und Kennzahlen eingesetzt wird.

* **Typografie** – Space Grotesk für Überschriften, Plus Jakarta Sans für
  Fließtext; beide per `next/font` lokal ausgeliefert (kein Google-Request zur
  Laufzeit, siehe Datenschutzerklärung).
* **Farben** – eine neutrale `ink`-Skala von `#08080a` bis `#e7e7ec`.
* **HeroUI v3** liefert die technische Basis (Buttons, Felder, Selects, Modals,
  Tabellen, Toasts, Dialoge). Das Theme wird in `globals.css` über CSS-Variablen
  überschrieben, damit die Seite nicht wie eine HeroUI-Demo aussieht.
* **Icons** ausschließlich Font Awesome. Kick und Trovo haben im freien Set kein
  offizielles Brand-Icon und bekommen deshalb ein neutrales Solid-Icon – das
  Kickstarter-Icon wäre eine andere Marke und wird bewusst nicht verwendet.
* **Bewegung** sparsam und kurz; `prefers-reduced-motion` schaltet Animationen
  global ab.
* Die Akzentfarbe ist im CMS änderbar und wird vor dem Einsetzen erneut gegen
  ein Hex-Muster geprüft.

Ein eigener `ButtonLink` nutzt HeroUIs `buttonVariants`, rendert aber ein echtes
`<a>` – Navigation bleibt so mit Mittelklick, „in neuem Tab öffnen“ und
Screenreadern korrekt.

---

## Deployment

1. Repository mit Vercel (oder einem anderen Node-Host) verbinden.
2. Alle Variablen aus `.env.example` in den Projekteinstellungen setzen.
3. In **MongoDB Atlas → Network Access** die IPs der Deployment-Umgebung
   freigeben.
4. `BETTER_AUTH_URL` und `NEXT_PUBLIC_SITE_URL` auf `https://jannikjbi.de`
   setzen und die OAuth-Redirect-URLs entsprechend eintragen.
5. Einmalig `npm run seed` gegen die Produktionsdatenbank laufen lassen.

---

## Offene Punkte

* **Hosting-Anbieter in der Datenschutzerklärung.** `/datenschutz` enthält an
  der entsprechenden Stelle einen sichtbaren Hinweis; Name, Sitz und
  Speicherdauer der Server-Logfiles müssen dort noch ergänzt werden. Alle
  übrigen Angaben beschreiben ausschließlich, was der Code tatsächlich tut.
* **Media-Bibliothek.** Bilder werden aktuell als URL plus Alt-Text gepflegt.
  Das Feld ist bereits ein eingebettetes Objekt, ein späterer Upload-Dienst
  lässt sich also ohne Migration ergänzen.
* **Better Auth Infrastructure** ist eingebunden, aber erst mit
  `BETTER_AUTH_API_KEY` aktiv.
