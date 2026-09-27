import "server-only";

import type { QueryFilter } from "mongoose";

import { Stream, type StreamDoc } from "@/server/models";
import type { Paginated, StreamDTO } from "@/lib/types";

import { connectToDatabase, safeRead } from "./db";
import { toStreamDTO } from "./serialize";

/**
 * Start of the current day in Europe/Berlin, expressed as a UTC instant.
 * A stream stays "upcoming" for the whole of its day rather than disappearing
 * from the schedule at midnight UTC.
 */
function startOfTodayBerlin(): Date {
  const now = new Date();
  const berlin = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  return new Date(`${berlin}T00:00:00.000Z`);
}

const populateGame = { path: "game", select: { name: 1, slug: 1 } } as const;

export async function listUpcomingStreams(limit = 8): Promise<StreamDTO[]> {
  return safeRead(
    "listUpcomingStreams",
    async () => {
      const docs = await Stream.find({ active: true, date: { $gte: startOfTodayBerlin() } })
        .populate(populateGame)
        .sort({ date: 1, startTime: 1 })
        .limit(limit)
        .lean()
        .exec();

      return docs.map(toStreamDTO);
    },
    [],
  );
}

/** The manual-schedule fallback used when the Twitch API has nothing to say. */
export async function getNextStream(): Promise<StreamDTO | null> {
  const [next] = await listUpcomingStreams(1);
  return next ?? null;
}

export async function listPastStreams(limit = 6): Promise<StreamDTO[]> {
  return safeRead(
    "listPastStreams",
    async () => {
      const docs = await Stream.find({ active: true, date: { $lt: startOfTodayBerlin() } })
        .populate(populateGame)
        .sort({ date: -1, startTime: -1 })
        .limit(limit)
        .lean()
        .exec();

      return docs.map(toStreamDTO);
    },
    [],
  );
}

/* -------------------------------------------------------------------------- */
/* CMS                                                                        */
/* -------------------------------------------------------------------------- */

export type AdminStreamQuery = {
  q?: string;
  page: number;
  perPage: number;
  scope?: "alle" | "kommend" | "vergangen";
};

export async function listAdminStreams(query: AdminStreamQuery): Promise<Paginated<StreamDTO>> {
  await connectToDatabase();

  const filter: QueryFilter<StreamDoc> = {};

  if (query.scope === "kommend") filter.date = { $gte: startOfTodayBerlin() };
  if (query.scope === "vergangen") filter.date = { $lt: startOfTodayBerlin() };

  if (query.q?.trim()) {
    filter.title = { $regex: query.q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
  }

  const [docs, total] = await Promise.all([
    Stream.find(filter)
      .populate(populateGame)
      .sort({ date: query.scope === "vergangen" ? -1 : 1, startTime: 1 })
      .skip((query.page - 1) * query.perPage)
      .limit(query.perPage)
      .lean()
      .exec(),
    Stream.countDocuments(filter).exec(),
  ]);

  return {
    items: docs.map(toStreamDTO),
    total,
    page: query.page,
    perPage: query.perPage,
    totalPages: Math.max(1, Math.ceil(total / query.perPage)),
  };
}
