import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";

import { SOCIAL_BRAND_COLORS, SOCIAL_ICONS } from "@/lib/icons";
import type { SocialLinkDTO } from "@/lib/types";
import { SOCIAL_PLATFORM_LABELS } from "@/lib/content-constants";
import { safeExternalUrl } from "@/lib/utils";

/**
 * Social card with the official Font Awesome brand icon. The brand colour only
 * appears on hover, so the grid stays calm at rest.
 */
export function SocialCard({ link }: { link: SocialLinkDTO }) {
  const href = safeExternalUrl(link.url);
  if (!href) return null;

  const label = link.label || SOCIAL_PLATFORM_LABELS[link.platform];
  const brand = SOCIAL_BRAND_COLORS[link.platform];

  return (
    <a
      href={href}
      target="_blank"
      rel="me noopener noreferrer"
      className="group card-surface flex items-center gap-4 p-4 transition-colors duration-200 hover:border-ink-600 sm:p-5"
    >
      <span
        className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-ink-700 bg-ink-850 text-ink-300 transition-colors duration-200"
        style={brand ? ({ "--brand": brand } as React.CSSProperties) : undefined}
      >
        <FontAwesomeIcon
          icon={SOCIAL_ICONS[link.platform]}
          className="size-[1.125rem] transition-colors duration-200 group-hover:text-[var(--brand,var(--color-gold-500))]"
          aria-hidden
        />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block font-display text-sm font-semibold text-ink-100">{label}</span>
        {link.handle ? (
          <span className="block truncate text-xs text-ink-500">@{link.handle}</span>
        ) : link.description ? (
          <span className="block truncate text-xs text-ink-500">{link.description}</span>
        ) : null}
      </span>

      <FontAwesomeIcon
        icon={faArrowUpRightFromSquare}
        className="size-3 shrink-0 text-ink-600 transition-colors duration-200 group-hover:text-ink-300"
        aria-hidden
      />
    </a>
  );
}
