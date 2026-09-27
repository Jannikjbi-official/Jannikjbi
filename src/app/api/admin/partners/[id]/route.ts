import type { NextRequest } from "next/server";

import { handlers } from "../handlers";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  return handlers.getOne(id);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return handlers.update(request, id);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  return handlers.remove(id);
}
