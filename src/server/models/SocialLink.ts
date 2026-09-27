import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { SOCIAL_PLATFORMS } from "./types";

const socialLinkSchema = new Schema(
  {
    /** Drives which official brand icon is rendered. */
    platform: { type: String, enum: SOCIAL_PLATFORMS, required: true },
    /** Display name; defaults to the platform label when empty. */
    label: { type: String, trim: true, maxlength: 60 },
    /** The @handle shown under the label, without the leading @. */
    handle: { type: String, trim: true, maxlength: 80 },
    url: { type: String, required: true, trim: true },
    description: { type: String, trim: true, maxlength: 200 },
    active: { type: Boolean, default: true, index: true },

    /** Notion page id when this entry originated from (or is mirrored to) Creator Buddy. */
    notionId: { type: String, trim: true, index: true, sparse: true },
    /** Last time this entry was reconciled with Notion. */
    notionSyncedAt: { type: Date },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "socialLinks" },
);

socialLinkSchema.index({ active: 1, sortOrder: 1 });

export type SocialLinkDoc = InferSchemaType<typeof socialLinkSchema>;

export const SocialLink: Model<SocialLinkDoc> =
  (models.SocialLink as Model<SocialLinkDoc>) ??
  model<SocialLinkDoc>("SocialLink", socialLinkSchema);
