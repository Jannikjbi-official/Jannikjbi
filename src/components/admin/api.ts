"use client";

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

/**
 * Thin fetch wrapper for the CMS.
 *
 * The admin APIs answer an unauthorized request with a plain 404, which is
 * indistinguishable from a missing route by design. When that happens the
 * session has most likely expired, so the CMS reloads and the server-side guard
 * decides what the visitor gets to see.
 */
export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(path, {
      ...init,
      headers: {
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => null)) as
      | (T & { error?: string; errors?: Record<string, string> })
      | null;

    if (!response.ok) {
      // A 404 on a collection endpoint means the session no longer authorizes
      // this caller. Reloading hands the decision back to the server guard.
      if (response.status === 404 && !path.match(/\/[a-f\d]{24}(\/|$)/i)) {
        window.location.reload();
        return { ok: false, message: "Sitzung abgelaufen." };
      }

      return {
        ok: false,
        message: payload?.error ?? "Die Aktion konnte nicht ausgeführt werden.",
        fieldErrors: payload?.errors,
      };
    }

    return { ok: true, data: payload as T };
  } catch {
    return { ok: false, message: "Keine Verbindung zum Server." };
  }
}
