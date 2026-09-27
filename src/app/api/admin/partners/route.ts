import type { NextRequest } from "next/server";

import { handlers } from "./handlers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return handlers.list(request);
}

export async function POST(request: NextRequest) {
  return handlers.create(request);
}
