import "server-only";

import { Partner } from "@/server/models";
import type { PartnerDTO } from "@/lib/types";

import { connectToDatabase, safeRead } from "./db";
import { toPartnerDTO } from "./serialize";

export async function listPublicPartners(): Promise<PartnerDTO[]> {
  return safeRead(
    "listPublicPartners",
    async () => {
      const docs = await Partner.find({ active: true })
        .sort({ featured: -1, sortOrder: 1, name: 1 })
        .lean()
        .exec();

      return docs.map(toPartnerDTO);
    },
    [],
  );
}

export async function listAllPartners(): Promise<PartnerDTO[]> {
  await connectToDatabase();
  const docs = await Partner.find({}).sort({ sortOrder: 1, name: 1 }).lean().exec();
  return docs.map(toPartnerDTO);
}
