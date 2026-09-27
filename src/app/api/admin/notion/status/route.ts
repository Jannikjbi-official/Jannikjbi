import { getNotionStatus } from "@/server/notion/sync";
import { requireAdminApi } from "@/server/auth/guard";
import { ok, serverError } from "@/server/api/respond";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    return ok(await getNotionStatus());
  } catch (error) {
    return serverError("notion.status", error);
  }
}
