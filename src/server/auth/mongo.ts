import { MongoClient, type Db } from "mongodb";

/**
 * Dedicated MongoDB handle for Better Auth.
 *
 * Auth data (user / session / account / verification / passkey) is kept apart
 * from the content models on purpose: content is reached through Mongoose in
 * `src/server/content`, auth only ever through this client. Nothing in the
 * content layer touches these collections and vice versa.
 */
const globalForAuthMongo = globalThis as typeof globalThis & {
  __jannikjbiAuthMongo?: { client: MongoClient; db: Db };
};

export function getAuthMongo(): { client: MongoClient; db: Db } {
  if (globalForAuthMongo.__jannikjbiAuthMongo) {
    return globalForAuthMongo.__jannikjbiAuthMongo;
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Copy .env.example to .env.local and configure it.",
    );
  }

  // The driver connects lazily on the first operation, so this stays cheap.
  const client = new MongoClient(uri);
  const db = process.env.MONGODB_DB ? client.db(process.env.MONGODB_DB) : client.db();

  globalForAuthMongo.__jannikjbiAuthMongo = { client, db };

  return globalForAuthMongo.__jannikjbiAuthMongo;
}
