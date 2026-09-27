import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";

/**
 * Font Awesome injects its stylesheet at runtime by default, which races with
 * Next.js' own CSS handling and causes oversized icons on first paint.
 * The stylesheet is imported above instead.
 */
config.autoAddCss = false;

export {};
