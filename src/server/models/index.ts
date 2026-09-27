/**
 * Importing this module registers every content model on the Mongoose
 * connection, which `populate()` requires. Data-access modules import from
 * here rather than from individual model files.
 */
export { Genre, type GenreDoc } from "./Genre";
export { Game, type GameDoc } from "./Game";
export { Stream, type StreamDoc } from "./Stream";
export { Project, type ProjectDoc } from "./Project";
export { SocialLink, type SocialLinkDoc } from "./SocialLink";
export { Partner, type PartnerDoc } from "./Partner";
export { SiteSettings, type SiteSettingsDoc } from "./SiteSettings";
export * from "./types";
