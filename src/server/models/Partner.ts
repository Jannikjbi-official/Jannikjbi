import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/**
 * A partner entry. `integration` decides how the block is rendered:
 *   - "instant-gaming" loads the official Instant Gaming banner script
 *     (only on the pages that actually show it)
 *   - "link" renders a plain, non-aggressive partner card
 */
const partnerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, trim: true, maxlength: 2000 },
    url: { type: String, trim: true },
    image: {
      type: new Schema(
        {
          url: { type: String, required: true, trim: true },
          alt: { type: String, trim: true, maxlength: 200 },
        },
        { _id: false },
      ),
      required: false,
    },
    integration: {
      type: String,
      enum: ["link", "instant-gaming"],
      default: "link",
    },
    /** Affiliate/partner tag, e.g. the Instant Gaming `igr` value. */
    affiliateId: { type: String, trim: true, maxlength: 80 },
    /** Required disclosure shown next to affiliate content. */
    disclosure: { type: String, trim: true, maxlength: 400 },
    featured: { type: Boolean, default: false },
    active: { type: Boolean, default: true, index: true },

    /** Notion page id when this entry originated from (or is mirrored to) Creator Buddy. */
    notionId: { type: String, trim: true, index: true, sparse: true },
    /** Last time this entry was reconciled with Notion. */
    notionSyncedAt: { type: Date },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "partners" },
);

partnerSchema.index({ active: 1, sortOrder: 1 });

export type PartnerDoc = InferSchemaType<typeof partnerSchema>;

export const Partner: Model<PartnerDoc> =
  (models.Partner as Model<PartnerDoc>) ?? model<PartnerDoc>("Partner", partnerSchema);
