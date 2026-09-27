import { PageHeading } from "@/components/admin/PageHeading";
import { StreamsManager } from "@/components/admin/managers/StreamsManager";
import { listAdminStreams } from "@/server/content/streams";
import { listAdminGames } from "@/server/content/games";

export const dynamic = "force-dynamic";

export default async function AdminStreamsPage() {
  const [streams, games] = await Promise.all([
    listAdminStreams({ page: 1, perPage: 100, scope: "alle" }),
    listAdminGames({ page: 1, perPage: 100 }),
  ]);

  return (
    <>
      <PageHeading
        title="Streamplan"
        description="Deine Streamtermine. Kommende Einträge erscheinen auf /content und auf der Startseite."
      />
      <StreamsManager initialItems={streams.items} games={games.items} />
    </>
  );
}
