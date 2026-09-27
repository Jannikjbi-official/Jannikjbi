import { PageHeading } from "@/components/admin/PageHeading";
import { NotionPanel } from "@/components/admin/NotionPanel";
import { getSiteSettingsForAdmin } from "@/server/content/settings";
import { getNotionStatus } from "@/server/notion/sync";

export const dynamic = "force-dynamic";

export default async function AdminNotionPage() {
  const [settings, status] = await Promise.all([
    getSiteSettingsForAdmin(),
    getNotionStatus(),
  ]);

  return (
    <>
      <PageHeading
        title="Creator Buddy (Notion)"
        description="Verbindung zu deinem Creator-Buddy-Dashboard: Kanäle, Content DB und Sponsoren mit der Website abgleichen."
      />
      <NotionPanel
        settings={settings}
        status={{ tokenConfigured: status.tokenConfigured, databases: status.databases }}
      />
    </>
  );
}
