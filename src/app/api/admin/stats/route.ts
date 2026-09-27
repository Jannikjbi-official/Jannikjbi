import { getCmsStats } from "@/server/content/stats";
import { requireAdminApi } from "@/server/auth/guard";
import { ok, serverError } from "@/server/api/respond";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    return ok(await getCmsStats());
  } catch (error) {
    return serverError("stats.get", error);
  }
}
