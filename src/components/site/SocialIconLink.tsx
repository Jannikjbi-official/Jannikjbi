import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { SOCIAL_ICONS } from "@/lib/icons";
import type { SocialLinkDTO } from "@/lib/types";
import { SOCIAL_PLATFORM_LABELS } from "@/lib/content-constants";
import { safeExternalUrl } from "@/lib/utils";

/** Compact icon-only link, used in the footer. */
export function SocialIconLink({ link }: { link: SocialLinkDTO }) {
  const href = safeExternalUrl(link.url);
  if (!href) return null;

  const label = link.label || SOCIAL_PLATFORM_LABELS[link.platform];

  return (
    <a
      href={href}
      target="_blank"
      rel="me noopener noreferrer"
      title={label}
      className="flex size-10 items-center justify-center rounded-lg border border-ink-700 bg-ink-850 text-ink-300 transition-colors duration-200 hover:border-gold-500/50 hover:text-gold-400"
    >
      <FontAwesomeIcon icon={SOCIAL_ICONS[link.platform]} className="size-4" aria-hidden />
      <span className="sr-only">{label}</span>
    </a>
  );
}
