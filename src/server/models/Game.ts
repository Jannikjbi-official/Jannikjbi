import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { GAME_STATUSES } from "./types";

const gameSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, required: true, trim: true, maxlength: 4000 },
    /** Short one-liner for cards; falls back to a trimmed description. */
    tagline: { type: String, trim: true, maxlength: 180 },
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
    genres: [{ type: Schema.Types.ObjectId, ref: "Genre", index: true }],
    status: { type: String, enum: GAME_STATUSES, default: "aktuell", index: true },
    active: { type: Boolean, default: true, index: true },
    featured: { type: Boolean, default: false, index: true },
    platform: [{ type: String, trim: true, maxlength: 60 }],
    releaseDate: { type: Date },
    steamUrl: { type: String, trim: true },
    websiteUrl: { type: String, trim: true },
    twitchUrl: { type: String, trim: true },
    youtubeUrl: { type: String, trim: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "games" },
);

// Public listings always filter on `active` and then order by sortOrder.
gameSchema.index({ active: 1, sortOrder: 1, name: 1 });
// Powers the search field on /games and in the CMS.
gameSchema.index({ name: "text", description: "text", tagline: "text" });

export type GameDoc = InferSchemaType<typeof gameSchema>;

export const Game: Model<GameDoc> =
  (models.Game as Model<GameDoc>) ?? model<GameDoc>("Game", gameSchema);
