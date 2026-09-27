import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

import { PageHeading } from "@/components/admin/PageHeading";
import { CreatorBuddyPanel } from "@/components/admin/CreatorBuddyPanel";
import { isNotionConfigured } from "@/server/notion/client";
import { getNotionConfig } from "@/server/notion/sync";

export const dynamic = "force-dynamic";

export default async function AdminCreatorBuddyPage() {
  const config = await getNotionConfig();
  const tokenConfigured = isNotionConfigured();

  const available = {
    content: Boolean(config.contentDbId),
    channels: Boolean(config.channelsDbId),
    sponsors: Boolean(config.sponsorsDbId),
    tasks: Boolean(config.tasksDbId),
  };

  return (
    <>
      <PageHeading
        title="Creator Buddy"
        description="Dein Notion-Dashboard direkt hier bearbeiten. Änderungen werden sofort nach Notion geschrieben."
      />

      {!tokenConfigured ? (
        <div className="flex gap-4 rounded-xl border border-gold-500/30 bg-gold-500/5 p-5">
          <FontAwesomeIcon
            icon={faTriangleExclamation}
            className="mt-0.5 size-4 shrink-0 text-gold-500"
            aria-hidden
          />
          <div className="text-sm leading-relaxed text-ink-300">
            <p className="font-semibold text-ink-100">NOTION_TOKEN fehlt.</p>
            <p className="mt-1.5">
              Ohne Token kann nicht auf Notion zugegriffen werden. Die Einrichtung ist unter{" "}
              <Link href="/admin/notion" className="text-gold-400 underline underline-offset-4">
                Synchronisierung
              </Link>{" "}
              beschrieben.
            </p>
          </div>
        </div>
      ) : (
        <CreatorBuddyPanel available={available} />
      )}
    </>
  );
}
