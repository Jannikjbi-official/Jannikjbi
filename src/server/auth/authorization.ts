import "server-only";

import { headers } from "next/headers";
import { ObjectId } from "mongodb";

import { getAuth } from "./auth";
import { getAuthMongo } from "./mongo";

/**
 * The single Discord account that owns this CMS.
 *
 * Authorization is decided here, on the server, against the `account`
 * collection — never from a client-supplied value, a cookie claim, or the
 * session object alone.
 */
export const ADMIN_DISCORD_ID =
  process.env.ADMIN_DISCORD_ID?.trim() || "1276986070675882006";

/**
 * Optional extra Twitch user ids. Empty by default: a Twitch login then only
 * works when that Twitch account is linked to the authorized Discord user,
 * because both accounts resolve to the same `userId`.
 *
 * Signing in with Twitch is an authentication method — it is never on its own
 * an authorization grant.
 */
function authorizedTwitchIds(): string[] {
  return (process.env.ADMIN_TWITCH_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export type AdminIdentity = {
  userId: string;
  name: string | null;
  email: string | null;
  image: string | null;
  /** Which linked account granted access. */
  via: "discord" | "twitch";
};

type AccountRow = {
  providerId?: unknown;
  accountId?: unknown;
};

/**
 * Resolves the current request to an authorized CMS identity, or `null`.
 *
 * `null` covers every failure the same way — no session, unknown user, banned
 * user, wrong Discord account, unlisted Twitch account, database error. Callers
 * must not distinguish between them in anything they send to the browser.
 */
export async function getAdminIdentity(): Promise<AdminIdentity | null> {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) return null;

    // The admin plugin can ban a user; a banned user is never authorized.
    if ((session.user as { banned?: boolean | null }).banned) return null;

    const userId = session.user.id;
    const { db } = getAuthMongo();

    // `account.userId` references `user.id`, which the Mongo adapter stores as
    // an ObjectId. Match both shapes so a custom id generator cannot silently
    // turn this check into a no-match (which would fail closed, but noisily).
    const userIdCandidates: unknown[] = [userId];
    if (ObjectId.isValid(userId)) userIdCandidates.push(new ObjectId(userId));

    const accounts = (await db
      .collection("account")
      .find({ userId: { $in: userIdCandidates } })
      .project({ providerId: 1, accountId: 1 })
      .toArray()) as AccountRow[];

    const linked = accounts.map((row) => ({
      providerId: typeof row.providerId === "string" ? row.providerId : "",
      accountId: typeof row.accountId === "string" ? row.accountId : String(row.accountId ?? ""),
    }));

    if (linked.some((a) => a.providerId === "discord" && a.accountId === ADMIN_DISCORD_ID)) {
      return identityFrom(session.user, "discord");
    }

    const twitchAllowlist = authorizedTwitchIds();
    if (
      twitchAllowlist.length > 0 &&
      linked.some((a) => a.providerId === "twitch" && twitchAllowlist.includes(a.accountId))
    ) {
      return identityFrom(session.user, "twitch");
    }

    return null;
  } catch {
    // Fail closed. Never surface the reason.
    return null;
  }
}

function identityFrom(
  user: { id: string; name?: string | null; email?: string | null; image?: string | null },
  via: AdminIdentity["via"],
): AdminIdentity {
  return {
    userId: user.id,
    name: user.name ?? null,
    email: user.email ?? null,
    image: user.image ?? null,
    via,
  };
}

/** Convenience boolean for places that only need a yes/no. */
export async function isAuthorizedAdmin(): Promise<boolean> {
  return (await getAdminIdentity()) !== null;
}
