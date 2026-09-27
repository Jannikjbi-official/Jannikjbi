import "server-only";

import { Project } from "@/server/models";
import type { ProjectDTO } from "@/lib/types";

import { connectToDatabase, safeRead } from "./db";
import { toProjectDTO } from "./serialize";

export async function listPublicProjects(): Promise<ProjectDTO[]> {
  return safeRead(
    "listPublicProjects",
    async () => {
      const docs = await Project.find({ active: true })
        .sort({ featured: -1, sortOrder: 1, name: 1 })
        .lean()
        .exec();

      return docs.map(toProjectDTO);
    },
    [],
  );
}

export async function listFeaturedProjects(limit = 3): Promise<ProjectDTO[]> {
  return safeRead(
    "listFeaturedProjects",
    async () => {
      const docs = await Project.find({ active: true, featured: true })
        .sort({ sortOrder: 1, name: 1 })
        .limit(limit)
        .lean()
        .exec();

      return docs.map(toProjectDTO);
    },
    [],
  );
}

export async function listAllProjects(): Promise<ProjectDTO[]> {
  await connectToDatabase();
  const docs = await Project.find({}).sort({ sortOrder: 1, name: 1 }).lean().exec();
  return docs.map(toProjectDTO);
}
