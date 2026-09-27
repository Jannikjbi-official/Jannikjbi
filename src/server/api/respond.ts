import "server-only";

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { fieldErrors } from "@/lib/validation/common";

const NO_STORE = { "Cache-Control": "no-store" } as const;

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status, headers: NO_STORE });
}

export function badRequest(message: string, errors?: Record<string, string>): NextResponse {
  return NextResponse.json({ error: message, errors }, { status: 400, headers: NO_STORE });
}

export function conflict(message: string, errors?: Record<string, string>): NextResponse {
  return NextResponse.json({ error: message, errors }, { status: 409, headers: NO_STORE });
}

export function missing(message = "Nicht gefunden."): NextResponse {
  return NextResponse.json({ error: message }, { status: 404, headers: NO_STORE });
}

/**
 * Generic 500. The real error is logged on the server only — the client never
 * receives a stack trace, a driver message or anything naming an internal path.
 */
export function serverError(label: string, error: unknown): NextResponse {
  console.error(`[api] ${label}:`, error);

  return NextResponse.json(
    { error: "Es ist ein Fehler aufgetreten. Bitte versuche es erneut." },
    { status: 500, headers: NO_STORE },
  );
}

/** Parses and validates a JSON body. */
export async function parseBody<S extends z.ZodTypeAny>(
  request: Request,
  schema: S,
): Promise<{ ok: true; data: z.infer<S> } | { ok: false; response: NextResponse }> {
  let raw: unknown;

  try {
    raw = await request.json();
  } catch {
    return { ok: false, response: badRequest("Ungültiger Request-Body.") };
  }

  const parsed = schema.safeParse(raw);

  if (!parsed.success) {
    return {
      ok: false,
      response: badRequest("Bitte prüfe deine Eingaben.", fieldErrors(parsed.error)),
    };
  }

  return { ok: true, data: parsed.data };
}

/** Translates a duplicate-key error into a field-level slug message. */
export function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === 11000
  );
}

/**
 * Refreshes the public pages a CMS change affects, so an edit is visible on
 * the site immediately instead of after the next revalidation window.
 */
export function revalidatePublic(paths: string[]): void {
  for (const path of paths) {
    try {
      revalidatePath(path, path === "/" ? "layout" : "page");
    } catch (error) {
      console.error(`[api] revalidate ${path} failed:`, error);
    }
  }
}

export const REVALIDATE = {
  games: ["/", "/games", "/content"],
  genres: ["/", "/games"],
  streams: ["/", "/content"],
  projects: ["/", "/projects"],
  socials: ["/"],
  partners: ["/", "/partners"],
  settings: ["/", "/about", "/games", "/content", "/projects", "/partners"],
} as const;
