import { PageHeading } from "@/components/admin/PageHeading";
import { GenresManager } from "@/components/admin/managers/GenresManager";
import { listAllGenres } from "@/server/content/genres";

export const dynamic = "force-dynamic";

export default async function AdminGenresPage() {
  const genres = await listAllGenres();

  return (
    <>
      <PageHeading
        title="Genres"
        description="Genres, die du Spielen zuordnen kannst. Die Reihenfolge bestimmt, wie sie im Genre-Filter erscheinen."
      />
      <GenresManager initialItems={genres} />
    </>
  );
}
