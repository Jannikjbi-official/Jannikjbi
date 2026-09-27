import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { STREAM_PLATFORMS } from "./types";

const streamSchema = new Schema(
  {
    /** Calendar day of the stream, stored at UTC midnight. */
    date: { type: Date, required: true, index: true },
    /** Local start time as "HH:MM" (Europe/Berlin). */
    startTime: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    endTime: { type: String, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    game: { type: Schema.Types.ObjectId, ref: "Game", index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 2000 },
    platform: { type: String, enum: STREAM_PLATFORMS, default: "twitch", index: true },
    link: { type: String, trim: true },
    /** Hidden entries stay in the CMS but disappear from the public schedule. */

    /** Notion page id when this entry originated from (or is mirrored to) Creator Buddy. */
    notionId: { type: String, trim: true, index: true, sparse: true },
    /** Last time this entry was reconciled with Notion. */
    notionSyncedAt: { type: Date },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, collection: "streams" },
);

streamSchema.index({ active: 1, date: 1, startTime: 1 });

export type StreamDoc = InferSchemaType<typeof streamSchema>;

export const Stream: Model<StreamDoc> =
  (models.Stream as Model<StreamDoc>) ?? model<StreamDoc>("Stream", streamSchema);
