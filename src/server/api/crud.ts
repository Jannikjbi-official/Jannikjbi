import "server-only";

import type { NextRequest } from "next/server";
import type { Model, QueryFilter, SortOrder } from "mongoose";
import type { NextResponse } from "next/server";
import type { z } from "zod";

import { requireAdminApi } from "@/server/auth/guard";
import { connectToDatabase } from "@/server/content/db";
import { escapeRegex } from "@/server/content/genres";

import {
  badRequest,
  conflict,
  isDuplicateKeyError,
  missing,
  ok,
  parseBody,
  revalidatePublic,
  serverError,
} from "./respond";

/* Mongoose models are invariant in their document type, so a factory that has
 * to accept any of them works with a loose model type internally. Everything
 * that leaves this module is typed through `toDTO`. */
/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyModel = Model<any>;

export type CrudConfig<TDto> = {
  /** Used in log lines only. */
  label: string;
  model: AnyModel;
  createSchema: z.ZodTypeAny;
  patchSchema: z.ZodTypeAny;
  toDTO: (doc: any) => TDto;
  /** Public paths refreshed after every successful write. */
  revalidate: readonly string[];
  sort: Record<string, SortOrder>;
  /** Fields a `?q=` search matches against. */
  searchFields: string[];
  /** Set when the collection has a unique slug. */
  hasSlug?: boolean;
};

/**
 * Builds the standard CMS collection handlers.
 *
 * Every handler starts with `requireAdminApi()`. An unauthorized caller gets a
 * plain 404 before any query runs, so hitting these routes by hand reveals
 * neither data nor the fact that the endpoint does anything.
 */
export function createCollectionHandlers<TDto>(config: CrudConfig<TDto>) {
  async function list(request: NextRequest): Promise<NextResponse> {
    const auth = await requireAdminApi();
    if (!auth.ok) return auth.response;

    try {
      await connectToDatabase();

      const params = request.nextUrl.searchParams;
      const search = params.get("q")?.trim();
      const activeParam = params.get("active");

      const filter: QueryFilter<any> = {};

      if (search && config.searchFields.length > 0) {
        const pattern = escapeRegex(search);
        filter.$or = config.searchFields.map((field) => ({
          [field]: { $regex: pattern, $options: "i" },
        }));
      }

      if (activeParam === "true" || activeParam === "false") {
        filter.active = activeParam === "true";
      }

      const docs = await config.model.find(filter).sort(config.sort).lean().exec();

      return ok({ items: docs.map(config.toDTO), total: docs.length });
    } catch (error) {
      return serverError(`${config.label}.list`, error);
    }
  }

  async function create(request: NextRequest): Promise<NextResponse> {
    const auth = await requireAdminApi();
    if (!auth.ok) return auth.response;

    const parsed = await parseBody(request, config.createSchema);
    if (!parsed.ok) return parsed.response;

    try {
      await connectToDatabase();

      const created = await config.model.create(parsed.data as Record<string, unknown>);
      const doc = await config.model.findById(created._id).lean().exec();

      revalidatePublic([...config.revalidate]);

      return ok({ item: config.toDTO(doc) }, 201);
    } catch (error) {
      if (config.hasSlug && isDuplicateKeyError(error)) {
        return conflict("Dieser Slug ist bereits vergeben.", {
          slug: "Dieser Slug ist bereits vergeben.",
        });
      }
      return serverError(`${config.label}.create`, error);
    }
  }

  async function getOne(id: string): Promise<NextResponse> {
    const auth = await requireAdminApi();
    if (!auth.ok) return auth.response;

    try {
      await connectToDatabase();
      const doc = await config.model.findById(id).lean().exec();
      if (!doc) return missing();
      return ok({ item: config.toDTO(doc) });
    } catch (error) {
      return serverError(`${config.label}.getOne`, error);
    }
  }

  async function update(request: NextRequest, id: string): Promise<NextResponse> {
    const auth = await requireAdminApi();
    if (!auth.ok) return auth.response;

    const parsed = await parseBody(request, config.patchSchema);
    if (!parsed.ok) return parsed.response;

    if (Object.keys(parsed.data as object).length === 0) {
      return badRequest("Keine Änderungen übermittelt.");
    }

    try {
      await connectToDatabase();

      const doc = await config.model
        .findByIdAndUpdate(
          id,
          { $set: parsed.data as Record<string, unknown> },
          { new: true, runValidators: true },
        )
        .lean()
        .exec();

      if (!doc) return missing();

      revalidatePublic([...config.revalidate]);

      return ok({ item: config.toDTO(doc) });
    } catch (error) {
      if (config.hasSlug && isDuplicateKeyError(error)) {
        return conflict("Dieser Slug ist bereits vergeben.", {
          slug: "Dieser Slug ist bereits vergeben.",
        });
      }
      return serverError(`${config.label}.update`, error);
    }
  }

  async function remove(id: string): Promise<NextResponse> {
    const auth = await requireAdminApi();
    if (!auth.ok) return auth.response;

    try {
      await connectToDatabase();

      const doc = await config.model.findByIdAndDelete(id).lean().exec();
      if (!doc) return missing();

      revalidatePublic([...config.revalidate]);

      return ok({ deleted: true });
    } catch (error) {
      return serverError(`${config.label}.remove`, error);
    }
  }

  return { list, create, getOne, update, remove };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
