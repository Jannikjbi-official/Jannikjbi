import "server-only";

import { connectToDatabase } from "@/server/db/mongoose";

// Registering every model up front is what makes `populate()` work regardless
// of which data module happens to run first.
import "@/server/models";

export { connectToDatabase };

/**
 * Wrapper for *public* reads.
 *
 * If MongoDB is unreachable the public site should degrade to its empty states
 * rather than render an error page, so the failure is logged on the server and
 * the caller gets its fallback. Admin reads and every write deliberately do
 * **not** use this — there a failure must surface as an error state in the CMS.
 */
export async function safeRead<T>(label: string, run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    await connectToDatabase();
    return await run();
  } catch (error) {
    console.error(`[content] ${label} failed:`, error);
    return fallback;
  }
}
