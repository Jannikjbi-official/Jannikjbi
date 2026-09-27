import mongoose, { type Mongoose } from "mongoose";

/**
 * Cached Mongoose connection.
 *
 * Next.js reloads server modules on every change in development and may run
 * several serverless instances in production, so the connection promise is
 * stashed on `globalThis` to avoid opening a new pool per request.
 */
type MongooseCache = {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
};

const globalForMongoose = globalThis as typeof globalThis & {
  __jannikjbiMongoose?: MongooseCache;
};

const cache: MongooseCache = (globalForMongoose.__jannikjbiMongoose ??= {
  conn: null,
  promise: null,
});

function getUri(): string {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Copy .env.example to .env.local and configure it.",
    );
  }

  return uri;
}

/**
 * Connects to MongoDB (or reuses the open connection) and makes sure every
 * content model is registered before the caller queries it.
 */
export async function connectToDatabase(): Promise<Mongoose> {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    mongoose.set("strictQuery", true);

    cache.promise = mongoose.connect(getUri(), {
      dbName: process.env.MONGODB_DB || undefined,
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10_000,
    });
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    // Let the next call retry instead of caching a rejected promise forever.
    cache.promise = null;
    throw error;
  }

  return cache.conn;
}
