/**
 * CLI wrapper around the shared seed.
 *
 *   npm run seed
 *
 * The content itself lives in `src/server/content/seed.ts`, so this script and
 * the protected seed endpoint always insert exactly the same thing.
 */

import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

import mongoose from "mongoose";

import { seedContent } from "@/server/content/seed";

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error(
      "MONGODB_URI ist nicht gesetzt. Lege .env.local nach dem Vorbild von .env.example an.",
    );
    process.exit(1);
  }

  const report = await seedContent();

  console.log("Seed abgeschlossen. Bestand in der Datenbank:");
  console.log(`  Genres:       ${report.genres}`);
  console.log(`  Games:        ${report.games}`);
  console.log(`  Projekte:     ${report.projects}`);
  console.log(`  Social Links: ${report.socialLinks}`);
  console.log(`  Partner:      ${report.partners}`);

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("Seed fehlgeschlagen:", error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
