import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminPage } from "@/server/auth/guard";

export const metadata: Metadata = {
  title: "CMS",
  robots: { index: false, follow: false, nocache: true },
};

// Authorization depends on the request's session, so nothing here may be
// statically rendered or cached.
export const dynamic = "force-dynamic";

/**
 * Server-side gate for every `/admin` route.
 *
 * `requireAdminPage()` re-derives authorization from the database on each
 * request and calls `notFound()` when it fails, so an unauthorized visitor
 * receives the ordinary 404 page with a 404 status — and no admin data is ever
 * rendered or sent to the browser.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const identity = await requireAdminPage();

  return (
    <AdminShell
      identity={{ name: identity.name, email: identity.email, image: identity.image }}
    >
      {children}
    </AdminShell>
  );
}
