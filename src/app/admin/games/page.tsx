import { PageHeading } from "@/components/admin/PageHeading";
import { GamesManager } from "@/components/admin/managers/GamesManager";
import { listAdminGames } from "@/server/content/games";
import { listAllGenres } from "@/server/content/genres";

export const dynamic = "force-dynamic";

export default async function AdminGamesPage() {
  const [games, genres] = await Promise.all([
    // The table filters and paginates client side, so the full set is loaded
    // once. The API stays paginated for larger libraries.
    listAdminGames({ page: 1, perPage: 100 }),
    listAllGenres(),
  ]);

  return (
    <>
      <PageHeading
        title="Games"
        description="Alle Spiele. Neue Einträge erscheinen sofort auf /games, sobald sie aktiv sind."
      />
      <GamesManager initialItems={games.items} genres={genres} />
    </>
  );
}
