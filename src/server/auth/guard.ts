import "server-only";

import { notFound } from "next/navigation";
import { NextResponse } from "next/server";

import { getAdminIdentity, type AdminIdentity } from "./authorization";

/**
 * Guard for server components under /admin.
 *
 * Anyone who is not the authorized owner gets the site's regular 404 page with
 * a real 404 status. Nothing in the response hints that a CMS exists, that the
 * visitor is merely unauthorized, or that their account was recognised.
 */
export async function requireAdminPage(): Promise<AdminIdentity> {
  const identity = await getAdminIdentity();
  if (!identity) notFound();
  return identity;
}

/**
 * Guard for /api/admin route handlers.
 *
 * Returns the identity on success, or a 404 `NextResponse` to return as-is.
 * The body is the same generic payload Next.js would produce for a missing
 * route, so probing the API reveals nothing.
 */
export async function requireAdminApi(): Promise<
  { ok: true; identity: AdminIdentity } | { ok: false; response: NextResponse }
> {
  const identity = await getAdminIdentity();

  if (!identity) {
    return { ok: false, response: notFoundResponse() };
  }

  return { ok: true, identity };
}

export function notFoundResponse(): NextResponse {
  return NextResponse.json(
    { error: "Not Found" },
    { status: 404, headers: { "Cache-Control": "no-store" } },
  );
}
