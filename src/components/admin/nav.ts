import {
  faCalendarDays,
  faDiagramProject,
  faGamepad,
  faGaugeHigh,
  faGear,
  faGlobe,
  faHandshake,
  faShareNodes,
  faRotate,
  faShieldHalved,
  faTableList,
  faTags,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: IconDefinition;
  /** Grouping header shown above the first item of each group. */
  group: "Inhalte" | "Website";
};

/** The CMS navigation. This is the Jannikjbi content CMS, not the Better Auth dashboard. */
export const ADMIN_NAV: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: faGaugeHigh, group: "Inhalte" },
  { href: "/admin/games", label: "Games", icon: faGamepad, group: "Inhalte" },
  { href: "/admin/genres", label: "Genres", icon: faTags, group: "Inhalte" },
  { href: "/admin/streams", label: "Streamplan", icon: faCalendarDays, group: "Inhalte" },
  { href: "/admin/projects", label: "Projekte", icon: faDiagramProject, group: "Inhalte" },
  { href: "/admin/social", label: "Social Media", icon: faShareNodes, group: "Inhalte" },
  { href: "/admin/partners", label: "Partner", icon: faHandshake, group: "Inhalte" },
  { href: "/admin/creator-buddy", label: "Creator Buddy", icon: faTableList, group: "Website" },
  { href: "/admin/notion", label: "Synchronisierung", icon: faRotate, group: "Website" },
  { href: "/admin/about", label: "Über mich", icon: faUser, group: "Website" },
  { href: "/admin/website", label: "Website", icon: faGlobe, group: "Website" },
  { href: "/admin/settings", label: "Settings", icon: faGear, group: "Website" },
  { href: "/admin/account", label: "Zugang", icon: faShieldHalved, group: "Website" },
];

/** Breadcrumb label for a path, falling back to the last segment. */
export function labelForPath(pathname: string): string {
  const match = ADMIN_NAV.find((item) => item.href === pathname);
  if (match) return match.label;

  const segment = pathname.split("/").filter(Boolean).at(-1) ?? "";
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}
