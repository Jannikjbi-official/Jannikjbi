import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { PROJECT_STATUSES } from "./types";

const projectSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, required: true, trim: true, maxlength: 4000 },
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
    category: { type: String, trim: true, maxlength: 60 },
    url: { type: String, trim: true },
    status: { type: String, enum: PROJECT_STATUSES, default: "live", index: true },
    active: { type: Boolean, default: true, index: true },
    featured: { type: Boolean, default: false, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "projects" },
);

projectSchema.index({ active: 1, sortOrder: 1, name: 1 });

export type ProjectDoc = InferSchemaType<typeof projectSchema>;

export const Project: Model<ProjectDoc> =
  (models.Project as Model<ProjectDoc>) ?? model<ProjectDoc>("Project", projectSchema);
