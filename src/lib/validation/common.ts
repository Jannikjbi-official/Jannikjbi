import { z } from "zod";

import { SLUG_PATTERN } from "@/lib/utils";

/** Turns "" (what an untouched form field sends) into `undefined`. */
export const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => {
    if (typeof value === "string" && value.trim() === "") return undefined;
    return value;
  }, schema.optional());

export const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Ungültige ID.");

export const slugSchema = z
  .string()
  .min(1, "Slug ist erforderlich.")
  .max(80, "Slug ist zu lang.")
  .regex(SLUG_PATTERN, "Nur Kleinbuchstaben, Zahlen und Bindestriche.");

/** Only absolute http(s) URLs may be stored. */
export const httpUrlSchema = z
  .string()
  .trim()
  .max(500, "URL ist zu lang.")
  .refine(
    (value) => {
      try {
        const url = new URL(value);
        return url.protocol === "https:" || url.protocol === "http:";
      } catch {
        return false;
      }
    },
    { message: "Bitte eine gültige http(s)-URL angeben." },
  );

export const optionalUrl = emptyToUndefined(httpUrlSchema);

export const hexColorSchema = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Bitte eine Hex-Farbe angeben, z. B. #ffc61a.");

export const imageSchema = z.object({
  url: httpUrlSchema,
  alt: z.string().trim().max(200).optional(),
});

export const optionalImage = z.preprocess((value) => {
  if (!value) return undefined;
  if (typeof value === "object" && value !== null) {
    const url = (value as { url?: unknown }).url;
    if (typeof url !== "string" || url.trim() === "") return undefined;
  }
  return value;
}, imageSchema.optional());

export const sortOrderSchema = z.coerce.number().int().min(-9999).max(9999).default(0);

/** Standard list query used by every CMS table. */
export const listQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListQuery = z.infer<typeof listQuerySchema>;

/** Flattens a ZodError into `{ field: message }` for form display. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};

  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "_";
    if (!(key in result)) result[key] = issue.message;
  }

  return result;
}
