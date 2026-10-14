# Videos

Ablage für Videodateien. Dieser Ordner existiert nur auf dem Branch `video`.

- **Nie in `main` mergen.** Sonst landen die Videos im Website-Branch.
- **Vercel baut diesen Branch nicht.** Das regelt `vercel.json` im Root
  (`git.deploymentEnabled.video = false`). Die Datei nicht entfernen, sonst
  entsteht bei jedem Push eine öffentlich erreichbare Vorschau.
- **Große Dateien laufen über Git LFS** (`.gitattributes`). GitHub lehnt
  normale Dateien über 100 MB ab. Vor dem ersten Commit einmal
  `git lfs install` ausführen; GitHub Desktop erledigt das selbst.
- **Privat ist der Branch nur, wenn das Repo privat ist.** In einem
  öffentlichen Repo kann jeder jeden Branch sehen.
