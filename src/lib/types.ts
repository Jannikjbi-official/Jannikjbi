import type { NotionResource, NotionSyncMode } from "./notion-constants";
import type {
  GameStatus,
  ProjectStatus,
  SocialPlatform,
  StreamPlatform,
} from "@/lib/content-constants";

/**
 * Plain, JSON-serialisable shapes handed from server components to client
 * components. Dates are ISO strings so nothing has to be re-serialised at the
 * server/client boundary.
 */

export type ImageDTO = {
  url: string;
  alt: string | null;
};

export type GenreDTO = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type GameDTO = {
  id: string;
  name: string;
  slug: string;
  description: string;
  tagline: string | null;
  image: ImageDTO | null;
  genres: GenreDTO[];
  status: GameStatus;
  active: boolean;
  featured: boolean;
  platform: string[];
  releaseDate: string | null;
  steamUrl: string | null;
  websiteUrl: string | null;
  twitchUrl: string | null;
  youtubeUrl: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type GameRefDTO = Pick<GameDTO, "id" | "name" | "slug">;

export type StreamDTO = {
  id: string;
  date: string;
  startTime: string;
  endTime: string | null;
  game: GameRefDTO | null;
  title: string;
  description: string | null;
  platform: StreamPlatform;
  link: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProjectDTO = {
  id: string;
  name: string;
  slug: string;
  description: string;
  tagline: string | null;
  image: ImageDTO | null;
  category: string | null;
  url: string | null;
  status: ProjectStatus;
  active: boolean;
  featured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type SocialLinkDTO = {
  id: string;
  platform: SocialPlatform;
  label: string | null;
  handle: string | null;
  url: string;
  description: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type PartnerDTO = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  url: string | null;
  image: ImageDTO | null;
  integration: "link" | "instant-gaming";
  affiliateId: string | null;
  disclosure: string | null;
  featured: boolean;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type SiteSettingsDTO = {
  creatorName: string;
  siteTitle: string;
  tagline: string;
  description: string;
  aboutHeadline: string;
  aboutText: string;
  heroHeadline: string;
  heroSubline: string;
  heroText: string;
  footerText: string;
  seo: {
    metaTitle: string | null;
    metaDescription: string | null;
    canonicalUrl: string | null;
    ogImage: string | null;
    keywords: string[];
  };
  contact: {
    email: string | null;
    businessEmail: string | null;
    note: string | null;
  };
  accentColor: string;
  twitchLogin: string | null;
  sections: {
    games: boolean;
    stream: boolean;
    projects: boolean;
    socials: boolean;
    partners: boolean;
  };
  notion: {
    contentDbId: string | null;
    channelsDbId: string | null;
    sponsorsDbId: string | null;
    modes: Record<NotionResource, NotionSyncMode>;
    lastSyncAt: string | null;
    lastSyncOk: boolean | null;
  };
};

/** Live channel data from the Twitch Helix API, when it is reachable. */
export type TwitchLiveDTO = {
  isLive: boolean;
  title: string | null;
  gameName: string | null;
  startedAt: string | null;
  url: string;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};
