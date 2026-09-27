import "server-only";

import { ObjectId } from "mongodb";

import { getAuthMongo } from "./mongo";

/**
 * Read-only view of the sign-in methods attached to the owner's account.
 *
 * Queried straight from the Better Auth collections rather than through the
 * client, so the CMS renders the real state on the server and the browser never
 * has to be trusted for it.
 */

export type LinkedAccount = {
  id: string;
  providerId: string;
  accountId: string;
  createdAt: string | null;
};

export type LinkedPasskey = {
  id: string;
  name: string | null;
  deviceType: string | null;
  createdAt: string | null;
};

/** `userId` is stored as an ObjectId; match both shapes to be safe. */
function userIdCandidates(userId: string): unknown[] {
  const candidates: unknown[] = [userId];
  if (ObjectId.isValid(userId)) candidates.push(new ObjectId(userId));
  return candidates;
}

const iso = (value: unknown): string | null =>
  value instanceof Date ? value.toISOString() : null;

const str = (value: unknown): string | null => {
  const text = typeof value === "string" ? value.trim() : "";
  return text === "" ? null : text;
};

export async function listLinkedAccounts(userId: string): Promise<LinkedAccount[]> {
  try {
    const { db } = getAuthMongo();

    const rows = await db
      .collection("account")
      .find({ userId: { $in: userIdCandidates(userId) } })
      .project({ providerId: 1, accountId: 1, createdAt: 1 })
      .toArray();

    return rows.map((row) => ({
      id: String(row._id),
      providerId: str(row.providerId) ?? "unbekannt",
      accountId: str(row.accountId) ?? "",
      createdAt: iso(row.createdAt),
    }));
  } catch (error) {
    console.error("[auth] listLinkedAccounts failed:", error);
    return [];
  }
}

export async function listPasskeys(userId: string): Promise<LinkedPasskey[]> {
  try {
    const { db } = getAuthMongo();

    const rows = await db
      .collection("passkey")
      .find({ userId: { $in: userIdCandidates(userId) } })
      .project({ name: 1, deviceType: 1, createdAt: 1 })
      .toArray();

    return rows.map((row) => ({
      id: String(row._id),
      name: str(row.name),
      deviceType: str(row.deviceType),
      createdAt: iso(row.createdAt),
    }));
  } catch (error) {
    console.error("[auth] listPasskeys failed:", error);
    return [];
  }
}
