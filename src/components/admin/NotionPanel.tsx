"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Spinner, toast } from "@heroui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleExclamation,
  faRotate,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";

import {
  NOTION_RESOURCES,
  NOTION_RESOURCE_LABELS,
  NOTION_SYNC_MODES,
  NOTION_SYNC_MODE_LABELS,
  type NotionResource,
  type NotionSyncMode,
} from "@/lib/notion-constants";
import type { SiteSettingsDTO } from "@/lib/types";
import { formatShortDate } from "@/lib/utils";

import { apiRequest } from "./api";
import { Field, type FieldSpec, type FormValues } from "./fields";

type DatabaseStatus = {
  resource: NotionResource;
  id: string | null;
  title: string | null;
  error: string | null;
  notShared: boolean;
};

type NotionStatus = {
  tokenConfigured: boolean;
  databases: DatabaseStatus[];
};

type SkippedRow = { title: string; reason: string };

type ResourceReport = {
  resource: NotionResource;
  mode: NotionSyncMode;
  created: number;
  updated: number;
  skipped: SkippedRow[];
  error?: string;
};

type SyncReport = {
  ranAt: string;
  ok: boolean;
  resources: ResourceReport[];
  error?: string;
};

const DB_FIELDS: FieldSpec[] = [
  {
    kind: "text",
    name: "notion.channelsDbId",
    label: "Kanäle – Datenbank-ID",
    span: 2,
    help: "ID oder Link der Notion-Datenbank „Kanäle“.",
  },
  {
    kind: "text",
    name: "notion.contentDbId",
    label: "Content DB – Datenbank-ID",
    span: 2,
    help: "ID oder Link der Notion-Datenbank „Content DB“.",
  },
  {
    kind: "text",
    name: "notion.sponsorsDbId",
    label: "Sponsoren – Datenbank-ID",
    span: 2,
    help: "ID oder Link der Notion-Datenbank „Sponsoren“.",
  },
];

/**
 * Control panel for the Creator Buddy (Notion) integration.
 *
 * Everything here runs through the protected admin API: the browser never
 * holds the Notion token and never talks to Notion directly.
 */
export function NotionPanel({
  settings,
  status,
}: {
  settings: SiteSettingsDTO;
  status: NotionStatus;
}) {
  const router = useRouter();

  const [values, setValues] = useState<FormValues>({
    "notion.channelsDbId": settings.notion.channelsDbId ?? "",
    "notion.contentDbId": settings.notion.contentDbId ?? "",
    "notion.sponsorsDbId": settings.notion.sponsorsDbId ?? "",
    "notion.modes.channels": settings.notion.modes.channels,
    "notion.modes.streams": settings.notion.modes.streams,
    "notion.modes.sponsors": settings.notion.modes.sponsors,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [syncing, setSyncing] = useState<NotionResource | "all" | null>(null);
  const [report, setReport] = useState<SyncReport | null>(null);

  function updateValue(name: string, value: unknown) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  async function saveSettings() {
    setIsSaving(true);
    setErrors({});

    const result = await apiRequest("/api/admin/settings", {
      method: "PUT",
      body: JSON.stringify({
        notion: {
          channelsDbId: values["notion.channelsDbId"],
          contentDbId: values["notion.contentDbId"],
          sponsorsDbId: values["notion.sponsorsDbId"],
          modes: {
            channels: values["notion.modes.channels"],
            streams: values["notion.modes.streams"],
            sponsors: values["notion.modes.sponsors"],
          },
        },
      }),
    });

    setIsSaving(false);

    if (!result.ok) {
      if (result.fieldErrors) setErrors(result.fieldErrors);
      toast.danger(result.message);
      return;
    }

    toast.success("Notion-Einstellungen gespeichert.");
    router.refresh();
  }

  async function sync(resource?: NotionResource) {
    setSyncing(resource ?? "all");
    setReport(null);

    const result = await apiRequest<SyncReport>("/api/admin/notion/sync", {
      method: "POST",
      body: JSON.stringify(resource ? { resources: [resource] } : {}),
    });

    setSyncing(null);

    if (!result.ok) {
      toast.danger(result.message);
      return;
    }

    setReport(result.data);

    if (result.data.error) {
      toast.danger(result.data.error);
    } else if (result.data.ok) {
      toast.success("Synchronisierung abgeschlossen.");
    } else {
      toast.warning("Synchronisierung mit Fehlern abgeschlossen.");
    }

    router.refresh();
  }

  const statusByResource = new Map(status.databases.map((entry) => [entry.resource, entry]));

  return (
    <div className="max-w-3xl space-y-8">
      {!status.tokenConfigured ? (
        <div className="flex gap-4 rounded-xl border border-gold-500/30 bg-gold-500/5 p-5">
          <FontAwesomeIcon
            icon={faTriangleExclamation}
            className="mt-0.5 size-4 shrink-0 text-gold-500"
            aria-hidden
          />
          <div className="text-sm leading-relaxed text-ink-300">
            <p className="font-semibold text-ink-100">NOTION_TOKEN fehlt.</p>
            <p className="mt-1.5">
              Lege unter{" "}
              <a
                href="https://www.notion.so/my-integrations"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold-400 underline underline-offset-4"
              >
                notion.so/my-integrations
              </a>{" "}
              eine interne Integration an, teile die Seite „Creator Buddy Dashboard“ mit ihr
              und hinterlege das Secret als Umgebungsvariable{" "}
              <span className="font-mono text-ink-200">NOTION_TOKEN</span>.
            </p>
          </div>
        </div>
      ) : null}

      {status.tokenConfigured && status.databases.some((entry) => entry.notShared) ? (
        <div className="flex gap-4 rounded-xl border border-gold-500/30 bg-gold-500/5 p-5">
          <FontAwesomeIcon
            icon={faTriangleExclamation}
            className="mt-0.5 size-4 shrink-0 text-gold-500"
            aria-hidden
          />
          <div className="text-sm leading-relaxed text-ink-300">
            <p className="font-semibold text-ink-100">
              Die Integration sieht deine Datenbanken noch nicht.
            </p>
            <p className="mt-1.5">
              Der Token ist gültig, aber in Notion ist noch nichts für ihn freigegeben. Eine
              Integration bekommt Zugriff erst, wenn du sie ausdrücklich zu einer Seite
              einlädst – die Datenbank-IDs allein genügen nicht.
            </p>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5">
              <li>
                In Notion die Seite{" "}
                <span className="text-ink-200">„Creator Buddy Dashboard“</span> öffnen.
              </li>
              <li>
                Oben rechts auf <span className="text-ink-200">···</span> klicken.
              </li>
              <li>
                <span className="text-ink-200">Verbindungen</span> wählen und die Integration
                hinzufügen.
              </li>
              <li>Hier auf „Erneut prüfen“ klicken.</li>
            </ol>
            <p className="mt-3 text-xs text-ink-500">
              Die Freigabe vererbt sich auf alle Unterseiten, also auf Content DB, Kanäle,
              Sponsoren und Aufgaben zugleich.
            </p>
            <Button variant="outline" size="sm" className="mt-4" onPress={() => router.refresh()}>
              <FontAwesomeIcon icon={faRotate} className="size-3.5" aria-hidden />
              Erneut prüfen
            </Button>
          </div>
        </div>
      ) : null}

      <section>
        <h2 className="mb-1 font-display text-base font-semibold text-ink-100">Datenbanken</h2>
        <p className="mb-5 text-sm text-ink-400">
          Die IDs der drei Creator-Buddy-Datenbanken. Du kannst den Notion-Link einfach
          hineinkopieren.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          {DB_FIELDS.map((field) => (
            <Field
              key={field.name}
              field={field}
              values={values}
              errors={errors}
              onChange={updateValue}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-1 font-display text-base font-semibold text-ink-100">Richtung</h2>
        <p className="mb-5 text-sm text-ink-400">
          Pro Bereich entscheidest du, wer führt. „Notion → Website“ überschreibt die Website,
          „Website → Notion“ schreibt deine CMS-Einträge nach Notion.
        </p>

        <div className="space-y-3">
          {NOTION_RESOURCES.map((resource) => {
            const dbStatus = statusByResource.get(resource);

            return (
              <div key={resource} className="card-surface p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-display text-sm font-semibold text-ink-100">
                      {NOTION_RESOURCE_LABELS[resource]}
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-xs">
                      {!status.tokenConfigured || !dbStatus?.id ? (
                        <span className="text-ink-500">Nicht konfiguriert</span>
                      ) : dbStatus.error ? (
                        <span className="flex items-center gap-1.5 text-danger">
                          <FontAwesomeIcon icon={faCircleExclamation} className="size-3" aria-hidden />
                          {dbStatus.error}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-emerald-400">
                          <FontAwesomeIcon icon={faCircleCheck} className="size-3" aria-hidden />
                          Verbunden mit „{dbStatus.title}“
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <div className="w-48">
                      <Field
                        field={{
                          kind: "select",
                          name: `notion.modes.${resource}`,
                          label: "Richtung",
                          options: NOTION_SYNC_MODES.map((mode) => ({
                            value: mode,
                            label: NOTION_SYNC_MODE_LABELS[mode],
                          })),
                        }}
                        values={values}
                        errors={errors}
                        onChange={updateValue}
                      />
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      isDisabled={syncing !== null || !status.tokenConfigured}
                      onPress={() => void sync(resource)}
                      className="self-end"
                    >
                      {syncing === resource ? (
                        <Spinner size="sm" aria-label="Synchronisiert" />
                      ) : (
                        <FontAwesomeIcon icon={faRotate} className="size-3.5" aria-hidden />
                      )}
                      Sync
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3 border-t border-ink-800 pt-6">
        <Button variant="primary" isDisabled={isSaving} onPress={() => void saveSettings()}>
          {isSaving ? "Wird gespeichert …" : "Einstellungen speichern"}
        </Button>

        <Button
          variant="secondary"
          isDisabled={syncing !== null || !status.tokenConfigured}
          onPress={() => void sync()}
        >
          {syncing === "all" ? "Synchronisiert …" : "Alles synchronisieren"}
        </Button>

        {settings.notion.lastSyncAt ? (
          <p className="text-xs text-ink-500">
            Zuletzt: {formatShortDate(settings.notion.lastSyncAt)}{" "}
            {settings.notion.lastSyncOk === false ? "(mit Fehlern)" : ""}
          </p>
        ) : null}
      </div>

      {report ? (
        <section aria-live="polite">
          <h2 className="mb-3 font-display text-base font-semibold text-ink-100">Ergebnis</h2>

          {report.error ? (
            <p className="card-surface p-4 text-sm text-danger">{report.error}</p>
          ) : (
            <ul className="space-y-3">
              {report.resources.map((entry) => (
                <li key={entry.resource} className="card-surface p-4">
                  <p className="font-display text-sm font-semibold text-ink-100">
                    {NOTION_RESOURCE_LABELS[entry.resource]}
                  </p>

                  {entry.error ? (
                    <p className="mt-2 text-sm text-danger">{entry.error}</p>
                  ) : entry.mode === "off" ? (
                    <p className="mt-2 text-sm text-ink-500">Übersprungen (Richtung: Aus).</p>
                  ) : (
                    <p className="mt-2 text-sm text-ink-300">
                      {entry.created} neu · {entry.updated} aktualisiert
                      {entry.skipped.length > 0 ? ` · ${entry.skipped.length} übersprungen` : ""}
                    </p>
                  )}

                  {entry.skipped.length > 0 ? (
                    <ul className="mt-3 space-y-1 border-t border-ink-800 pt-3">
                      {entry.skipped.map((row, index) => (
                        <li key={index} className="text-xs text-ink-500">
                          <span className="text-ink-400">{row.title}</span> – {row.reason}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
