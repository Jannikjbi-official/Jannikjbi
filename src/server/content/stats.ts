import "server-only";

import { Game, Genre, Partner, Project, SocialLink, Stream } from "@/server/models";

import { connectToDatabase } from "./db";

export type CmsStats = {
  games: { total: number; active: number; featured: number };
  genres: { total: number; active: number };
  projects: { total: number; active: number };
  streams: { total: number; upcoming: number };
  socialLinks: { total: number; active: number };
  partners: { total: number; active: number };
};

/**
 * Dashboard counters. Every number is a real `countDocuments` result — the
 * dashboard shows zeros on a fresh installation rather than sample figures.
 */
export async function getCmsStats(): Promise<CmsStats> {
  await connectToDatabase();

  const todayBerlin = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const startOfToday = new Date(`${todayBerlin}T00:00:00.000Z`);

  const [
    games,
    activeGames,
    featuredGames,
    genres,
    activeGenres,
    projects,
    activeProjects,
    streams,
    upcomingStreams,
    socialLinks,
    activeSocialLinks,
    partners,
    activePartners,
  ] = await Promise.all([
    Game.countDocuments({}),
    Game.countDocuments({ active: true }),
    Game.countDocuments({ active: true, featured: true }),
    Genre.countDocuments({}),
    Genre.countDocuments({ active: true }),
    Project.countDocuments({}),
    Project.countDocuments({ active: true }),
    Stream.countDocuments({}),
    Stream.countDocuments({ active: true, date: { $gte: startOfToday } }),
    SocialLink.countDocuments({}),
    SocialLink.countDocuments({ active: true }),
    Partner.countDocuments({}),
    Partner.countDocuments({ active: true }),
  ]);

  return {
    games: { total: games, active: activeGames, featured: featuredGames },
    genres: { total: genres, active: activeGenres },
    projects: { total: projects, active: activeProjects },
    streams: { total: streams, upcoming: upcomingStreams },
    socialLinks: { total: socialLinks, active: activeSocialLinks },
    partners: { total: partners, active: activePartners },
  };
}
