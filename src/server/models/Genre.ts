import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const genreSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, trim: true, maxlength: 400 },
    /** Font Awesome icon name, e.g. "faTrainSubway". Optional. */
    icon: { type: String, trim: true, maxlength: 60 },
    /** Hex colour used for the genre chip. Optional; falls back to the neutral chip. */
    color: { type: String, trim: true, match: /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/ },
    active: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "genres" },
);

genreSchema.index({ sortOrder: 1, name: 1 });

export type GenreDoc = InferSchemaType<typeof genreSchema>;

export const Genre: Model<GenreDoc> =
  (models.Genre as Model<GenreDoc>) ?? model<GenreDoc>("Genre", genreSchema);
