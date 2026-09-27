import {
  faBluesky,
  faDiscord,
  faFacebook,
  faInstagram,
  faKoFi,
  faSteam,
  faThreads,
  faTiktok,
  faTwitch,
  faXTwitter,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";
import {
  faGlobe,
  faSatelliteDish,
  faTowerBroadcast,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

import type { SocialPlatform, StreamPlatform } from "@/lib/content-constants";

/**
 * Official Font Awesome brand icons per platform.
 *
 * Kick and Trovo have no brand icon in the Font Awesome free set. They get a
 * neutral solid icon rather than a lookalike from another company (the
 * Kickstarter icon is a different brand and must not stand in for Kick).
 */
export const SOCIAL_ICONS: Record<SocialPlatform, IconDefinition> = {
  twitch: faTwitch,
  youtube: faYoutube,
  discord: faDiscord,
  kick: faTowerBroadcast,
  trovo: faSatelliteDish,
  kofi: faKoFi,
  steam: faSteam,
  tiktok: faTiktok,
  instagram: faInstagram,
  facebook: faFacebook,
  x: faXTwitter,
  bluesky: faBluesky,
  threads: faThreads,
  website: faGlobe,
};

export const STREAM_PLATFORM_ICONS: Record<StreamPlatform, IconDefinition> = {
  twitch: faTwitch,
  youtube: faYoutube,
  kick: faTowerBroadcast,
  trovo: faSatelliteDish,
  andere: faTowerBroadcast,
};

/** Brand colours, used only for subtle hover tints on the social cards. */
export const SOCIAL_BRAND_COLORS: Partial<Record<SocialPlatform, string>> = {
  twitch: "#9146ff",
  youtube: "#ff0033",
  discord: "#5865f2",
  kick: "#53fc18",
  trovo: "#1cbc72",
  kofi: "#ff5e5b",
  steam: "#66c0f4",
  tiktok: "#25f4ee",
  instagram: "#e1306c",
  facebook: "#1877f2",
  x: "#ffffff",
  bluesky: "#0a7aff",
  threads: "#ffffff",
};
