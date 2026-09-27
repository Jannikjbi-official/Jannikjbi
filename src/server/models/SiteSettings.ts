import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/**
 * Singleton document holding every globally editable text and setting.
 * Pinned to `key: "default"` so there can only ever be one.
 */
const siteSettingsSchema = new Schema(
  {
    key: { type: String, default: "default", unique: true, immutable: true },

    creatorName: { type: String, trim: true, maxlength: 80, default: "Jannikjbi" },
    siteTitle: { type: String, trim: true, maxlength: 120 },
    tagline: { type: String, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 400 },

    /** Rendered as paragraphs on /about. Blank lines separate paragraphs. */
    aboutText: { type: String, trim: true, maxlength: 8000 },
    aboutHeadline: { type: String, trim: true, maxlength: 160 },

    heroHeadline: { type: String, trim: true, maxlength: 160 },
    heroSubline: { type: String, trim: true, maxlength: 200 },
    heroText: { type: String, trim: true, maxlength: 1200 },

    footerText: { type: String, trim: true, maxlength: 400 },

    seo: {
      type: new Schema(
        {
          metaTitle: { type: String, trim: true, maxlength: 160 },
          metaDescription: { type: String, trim: true, maxlength: 400 },
          canonicalUrl: { type: String, trim: true },
          ogImage: { type: String, trim: true },
          keywords: [{ type: String, trim: true, maxlength: 40 }],
        },
        { _id: false },
      ),
      default: () => ({}),
    },

    contact: {
      type: new Schema(
        {
          email: { type: String, trim: true, maxlength: 160 },
          businessEmail: { type: String, trim: true, maxlength: 160 },
          note: { type: String, trim: true, maxlength: 400 },
        },
        { _id: false },
      ),
      default: () => ({}),
    },

    /** Accent colour of the whole site. Injected as a CSS variable. */
    accentColor: {
      type: String,
      trim: true,
      default: "#ffc61a",
      match: /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/,
    },

    /** Twitch channel used for the live-status lookup. */
    twitchLogin: { type: String, trim: true, maxlength: 60 },

    /**
     * Creator Buddy (Notion) integration. Database ids live here rather than in
     * the environment so they can be pasted in the CMS; environment variables
     * still act as a fallback.
     */
    notion: {
      type: new Schema(
        {
          contentDbId: { type: String, trim: true, maxlength: 120 },
          channelsDbId: { type: String, trim: true, maxlength: 120 },
          sponsorsDbId: { type: String, trim: true, maxlength: 120 },
          tasksDbId: { type: String, trim: true, maxlength: 120 },
          modes: {
            type: new Schema(
              {
                channels: { type: String, enum: ["off", "pull", "push"], default: "off" },
                streams: { type: String, enum: ["off", "pull", "push"], default: "off" },
                sponsors: { type: String, enum: ["off", "pull", "push"], default: "off" },
              },
              { _id: false },
            ),
            default: () => ({}),
          },
          lastSyncAt: { type: Date },
          lastSyncOk: { type: Boolean },
        },
        { _id: false },
      ),
      default: () => ({}),
    },

    /** Toggle individual homepage sections without touching code. */
    sections: {
      type: new Schema(
        {
          games: { type: Boolean, default: true },
          stream: { type: Boolean, default: true },
          projects: { type: Boolean, default: true },
          socials: { type: Boolean, default: true },
          partners: { type: Boolean, default: true },
        },
        { _id: false },
      ),
      default: () => ({}),
    },
  },
  { timestamps: true, collection: "siteSettings" },
);

export type SiteSettingsDoc = InferSchemaType<typeof siteSettingsSchema>;

export const SiteSettings: Model<SiteSettingsDoc> =
  (models.SiteSettings as Model<SiteSettingsDoc>) ??
  model<SiteSettingsDoc>("SiteSettings", siteSettingsSchema);
