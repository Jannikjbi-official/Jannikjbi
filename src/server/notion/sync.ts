import "server-only";

import { Partner, SocialLink, Stream } from "@/server/models";
import { connectToDatabase } from "@/server/content/db";
import {
  NOTION_DEFAULT_PUSH_STATUS,
  STREAM_TO_NOTION_PLATFORM,
  type NotionResource,
  type NotionSyncMode,
} from "@/lib/notion-constants";
import { getSiteSettingsForAdmin } from "@/server/content/settings";

import {
  NotionError,
  createPage,
  isNotionConfigured,
  queryDatabase,
  retrieveDatabase,
  updatePage,
  type NotionPage,
} from "./client";
import { mapChannel, mapSponsor, mapStream, type SkippedRow } from "./map";

export type ResourceReport = {
  resource: NotionResource;
  mode: NotionSyncMode;
  created: number;
  updated: number;
  skipped: SkippedRow[];
  error?: string;
};

export type SyncReport = {
  ranAt: string;
  ok: boolean;
  resources: ResourceReport[];
  /** Set when the whole run could not start (no token, no database ids). */
  error?: string;
};

export type NotionConfig = {
  contentDbId: string | null;
  channelsDbId: string | null;
  sponsorsDbId: string | null;
  modes: Record<NotionResource, NotionSyncMode>;
};

/**
 * Database ids come from the CMS settings, with environment variables as the
 * fallback so a deployment can be wired up before anyone opens the dashboard.
 */
export async function getNotionConfig(): Promise<NotionConfig> {
  const settings = await getSiteSettingsForAdmin();
  const notion = settings.notion;

  return {
    contentDbId: notion.contentDbId || process.env.NOTION_CONTENT_DB_ID || null,
    channelsDbId: notion.channelsDbId || process.env.NOTION_CHANNELS_DB_ID || null,
    sponsorsDbId: notion.sponsorsDbId || process.env.NOTION_SPONSORS_DB_ID || null,
    modes: notion.modes,
  };
}

/* -------------------------------------------------------------------------- */
/* Orchestration                                                              */
/* -------------------------------------------------------------------------- */

export async function runSync(only?: NotionResource[]): Promise<SyncReport> {
  const ranAt = new Date().toISOString();

  if (!isNotionConfigured()) {
    return {
      ranAt,
      ok: false,
      resources: [],
      error: "NOTION_TOKEN ist nicht gesetzt. Ohne Token kann nicht synchronisiert werden.",
    };
  }

  await connectToDatabase();

  const config = await getNotionConfig();
  const wanted = only ?? (["channels", "streams", "sponsors"] as NotionResource[]);
  const resources: ResourceReport[] = [];

  // Channels are loaded first either way: a stream's platform is derived from
  // the channel it relates to.
  let channelPages: NotionPage[] = [];

  if (config.channelsDbId) {
    try {
      channelPages = await queryDatabase(config.channelsDbId);
    } catch (error) {
      console.error("[notion] loading channels failed:", error);
    }
  }

  for (const resource of wanted) {
    const mode = config.modes[resource];

    if (mode === "off") {
      resources.push({ resource, mode, created: 0, updated: 0, skipped: [] });
      continue;
    }

    try {
      if (resource === "channels") {
        resources.push(await syncChannels(config, mode, channelPages));
      } else if (resource === "streams") {
        resources.push(await syncStreams(config, mode, channelPages));
      } else {
        resources.push(await syncSponsors(config, mode));
      }
    } catch (error) {
      console.error(`[notion] sync ${resource} failed:`, error);
      resources.push({
        resource,
        mode,
        created: 0,
        updated: 0,
        skipped: [],
        error:
          error instanceof NotionError
            ? `Notion: ${error.message}`
            : "Die Synchronisierung ist fehlgeschlagen.",
      });
    }
  }

  return { ranAt, ok: resources.every((entry) => !entry.error), resources };
}

/* -------------------------------------------------------------------------- */
/* Kanäle -> social links                                                     */
/* -------------------------------------------------------------------------- */

async function syncChannels(
  config: NotionConfig,
  mode: NotionSyncMode,
  pages: NotionPage[],
): Promise<ResourceReport> {
  const report: ResourceReport = { resource: "channels", mode, created: 0, updated: 0, skipped: [] };

  if (!config.channelsDbId) {
    report.error = 'Keine Datenbank-ID für "Kanäle" hinterlegt.';
    return report;
  }

  // Pushing channels is not supported: the website's social links are a subset
  // of the channels and pushing would create duplicates in Creator Buddy.
  if (mode === "push") {
    report.error = 'Für "Kanäle" ist nur die Richtung Notion → Website möglich.';
    return report;
  }

  for (const page of pages) {
    const mapped = mapChannel(page);

    if (!mapped) {
      report.skipped.push({ title: "(Kanal)", reason: "Keine gültige URL hinterlegt" });
      continue;
    }

    // Match on the Notion id first, then on the URL, so a link that was created
    // by hand before the first sync is adopted rather than duplicated.
    const existing =
      (await SocialLink.findOne({ notionId: mapped.notionId }).exec()) ??
      (await SocialLink.findOne({ url: mapped.url }).exec());

    if (existing) {
      existing.set({
        platform: mapped.platform,
        label: mapped.label,
        handle: mapped.handle ?? undefined,
        url: mapped.url,
        notionId: mapped.notionId,
        notionSyncedAt: new Date(),
      });
      await existing.save();
      report.updated += 1;
      continue;
    }

    await SocialLink.create({
      platform: mapped.platform,
      label: mapped.label,
      handle: mapped.handle ?? undefined,
      url: mapped.url,
      active: true,
      sortOrder: 0,
      notionId: mapped.notionId,
      notionSyncedAt: new Date(),
    });
    report.created += 1;
  }

  return report;
}

/* -------------------------------------------------------------------------- */
/* Content DB (Typ = Stream) <-> streams                                      */
/* -------------------------------------------------------------------------- */

async function syncStreams(
  config: NotionConfig,
  mode: NotionSyncMode,
  channelPages: NotionPage[],
): Promise<ResourceReport> {
  const report: ResourceReport = { resource: "streams", mode, created: 0, updated: 0, skipped: [] };

  if (!config.contentDbId) {
    report.error = 'Keine Datenbank-ID für "Content DB" hinterlegt.';
    return report;
  }

  const channelPlatformById = new Map<string, string | null>();
  const channelIdByPlatform = new Map<string, string>();

  for (const page of channelPages) {
    const mapped = mapChannel(page);
    const id = page.id.replace(/-/g, "");
    channelPlatformById.set(id, mapped?.notionPlatform ?? null);

    if (mapped?.notionPlatform && !channelIdByPlatform.has(mapped.notionPlatform)) {
      channelIdByPlatform.set(mapped.notionPlatform, page.id);
    }
  }

  if (mode === "pull") {
    for (const page of await queryDatabase(config.contentDbId)) {
      const result = mapStream(page, channelPlatformById);

      if ("skipped" in result) {
        report.skipped.push(result.skipped);
        continue;
      }

      const mapped = result.stream;
      const existing = await Stream.findOne({ notionId: mapped.notionId }).exec();

      if (existing) {
        existing.set({
          title: mapped.title,
          date: mapped.date,
          startTime: mapped.startTime,
          platform: mapped.platform,
          link: mapped.link ?? undefined,
          active: mapped.active,
          notionSyncedAt: new Date(),
        });
        await existing.save();
        report.updated += 1;
        continue;
      }

      await Stream.create({
        title: mapped.title,
        date: mapped.date,
        startTime: mapped.startTime,
        platform: mapped.platform,
        link: mapped.link ?? undefined,
        active: mapped.active,
        notionId: mapped.notionId,
        notionSyncedAt: new Date(),
      });
      report.created += 1;
    }

    return report;
  }

  // push: every stream in the CMS is mirrored into the Content DB.
  const streams = await Stream.find({}).sort({ date: 1 }).exec();

  for (const stream of streams) {
    const startsAt = toIsoWithTime(stream.date as Date, String(stream.startTime));
    const notionPlatform = STREAM_TO_NOTION_PLATFORM[stream.platform as keyof typeof STREAM_TO_NOTION_PLATFORM];
    const channelPageId = notionPlatform ? channelIdByPlatform.get(notionPlatform) : undefined;

    const properties: Record<string, unknown> = {
      Name: { title: [{ text: { content: String(stream.title).slice(0, 2000) } }] },
      Typ: { select: { name: "Stream" } },
      Veröffentlichungsdatum: { date: { start: startsAt } },
      Idee: { checkbox: false },
      ...(stream.link ? { URL: { url: String(stream.link) } } : {}),
      ...(channelPageId ? { Kanal: { relation: [{ id: channelPageId }] } } : {}),
    };

    if (stream.notionId) {
      await updatePage(String(stream.notionId), properties);
      stream.set({ notionSyncedAt: new Date() });
      await stream.save();
      report.updated += 1;
      continue;
    }

    const created = await createPage(config.contentDbId, {
      ...properties,
      Status: { select: { name: NOTION_DEFAULT_PUSH_STATUS } },
    });

    stream.set({ notionId: created.id.replace(/-/g, ""), notionSyncedAt: new Date() });
    await stream.save();
    report.created += 1;
  }

  return report;
}

/** Combines the stored UTC-midnight day with "HH:MM" local into an ISO string. */
function toIsoWithTime(date: Date, startTime: string): string {
  const day = date.toISOString().slice(0, 10);
  return `${day}T${/^\d{2}:\d{2}$/.test(startTime) ? startTime : "19:00"}:00`;
}

/* -------------------------------------------------------------------------- */
/* Sponsoren -> partners                                                      */
/* -------------------------------------------------------------------------- */

async function syncSponsors(
  config: NotionConfig,
  mode: NotionSyncMode,
): Promise<ResourceReport> {
  const report: ResourceReport = { resource: "sponsors", mode, created: 0, updated: 0, skipped: [] };

  if (!config.sponsorsDbId) {
    report.error = 'Keine Datenbank-ID für "Sponsoren" hinterlegt.';
    return report;
  }

  if (mode === "push") {
    report.error = 'Für "Sponsoren" ist nur die Richtung Notion → Website möglich.';
    return report;
  }

  for (const page of await queryDatabase(config.sponsorsDbId)) {
    const mapped = mapSponsor(page);

    if (!mapped) {
      report.skipped.push({ title: "(Sponsor)", reason: "Kein Name gesetzt" });
      continue;
    }

    const existing = await Partner.findOne({ notionId: mapped.notionId }).exec();

    if (existing) {
      // Only the name is refreshed: description, logo, links and the release
      // flag are editorial and belong to the CMS.
      existing.set({ name: mapped.name, notionSyncedAt: new Date() });
      await existing.save();
      report.updated += 1;
      continue;
    }

    if (await Partner.exists({ slug: mapped.slug })) {
      report.skipped.push({
        title: mapped.name,
        reason: `Ein Partner mit dem Slug "${mapped.slug}" existiert bereits`,
      });
      continue;
    }

    await Partner.create({
      name: mapped.name,
      slug: mapped.slug,
      integration: "link",
      // Imported sponsors stay hidden until they are reviewed and released.
      active: false,
      featured: false,
      sortOrder: 0,
      notionId: mapped.notionId,
      notionSyncedAt: new Date(),
    });
    report.created += 1;
  }

  return report;
}

/* -------------------------------------------------------------------------- */
/* Status                                                                     */
/* -------------------------------------------------------------------------- */

export type NotionStatus = {
  tokenConfigured: boolean;
  config: NotionConfig;
  databases: Array<{
    resource: NotionResource;
    id: string | null;
    title: string | null;
    error: string | null;
  }>;
};

/** Verifies the token and each configured database id for the CMS panel. */
export async function getNotionStatus(): Promise<NotionStatus> {
  const config = await getNotionConfig();
  const tokenConfigured = isNotionConfigured();

  const entries: Array<{ resource: NotionResource; id: string | null }> = [
    { resource: "channels", id: config.channelsDbId },
    { resource: "streams", id: config.contentDbId },
    { resource: "sponsors", id: config.sponsorsDbId },
  ];

  const databases = await Promise.all(
    entries.map(async ({ resource, id }) => {
      if (!tokenConfigured || !id) {
        return { resource, id, title: null, error: null };
      }

      try {
        const database = await retrieveDatabase(id);
        return { resource, id, title: database.title, error: null };
      } catch (error) {
        return {
          resource,
          id,
          title: null,
          error:
            error instanceof NotionError
              ? error.message
              : "Die Datenbank konnte nicht gelesen werden.",
        };
      }
    }),
  );

  return { tokenConfigured, config, databases };
}
