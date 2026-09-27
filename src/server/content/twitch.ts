import "server-only";

import type { TwitchLiveDTO } from "@/lib/types";

/**
 * Twitch Helix live status.
 *
 * Every failure path — missing credentials, network error, rate limit, bad
 * response — resolves to `null`. Callers treat `null` as "no API data" and fall
 * back to the manual stream schedule, so the site never breaks when Twitch is
 * unreachable.
 */

type CachedToken = { token: string; expiresAt: number };

const globalForTwitch = globalThis as typeof globalThis & {
  __jannikjbiTwitchToken?: CachedToken;
};

async function getAppAccessToken(): Promise<string | null> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) return null;

  const cached = globalForTwitch.__jannikjbiTwitchToken;
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

  try {
    const response = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
      }),
      cache: "no-store",
    });

    if (!response.ok) return null;

    const data = (await response.json()) as { access_token?: string; expires_in?: number };
    if (!data.access_token) return null;

    globalForTwitch.__jannikjbiTwitchToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
    };

    return data.access_token;
  } catch (error) {
    console.error("[twitch] token request failed:", error);
    return null;
  }
}

export async function getTwitchLiveStatus(login?: string | null): Promise<TwitchLiveDTO | null> {
  const channel = (login || process.env.TWITCH_LOGIN || "").trim().toLowerCase();
  if (!channel) return null;

  const clientId = process.env.TWITCH_CLIENT_ID;
  const token = await getAppAccessToken();
  if (!clientId || !token) return null;

  try {
    const response = await fetch(
      `https://api.twitch.tv/helix/streams?user_login=${encodeURIComponent(channel)}`,
      {
        headers: { "Client-Id": clientId, Authorization: `Bearer ${token}` },
        // One lookup a minute is plenty and keeps the page cacheable.
        next: { revalidate: 60 },
      },
    );

    if (!response.ok) {
      // An expired cached token is the common case; drop it so the next call
      // fetches a fresh one.
      if (response.status === 401) globalForTwitch.__jannikjbiTwitchToken = undefined;
      return null;
    }

    const payload = (await response.json()) as {
      data?: Array<{ title?: string; game_name?: string; started_at?: string }>;
    };

    const stream = payload.data?.[0];
    const url = `https://www.twitch.tv/${channel}`;

    if (!stream) {
      return { isLive: false, title: null, gameName: null, startedAt: null, url };
    }

    return {
      isLive: true,
      title: stream.title?.trim() || null,
      gameName: stream.game_name?.trim() || null,
      startedAt: stream.started_at ?? null,
      url,
    };
  } catch (error) {
    console.error("[twitch] live status request failed:", error);
    return null;
  }
}
