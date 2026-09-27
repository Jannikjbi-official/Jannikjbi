import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";

import type { PartnerDTO } from "@/lib/types";
import { displayHost, safeExternalUrl } from "@/lib/utils";

import { InstantGamingBanner } from "./InstantGamingBanner";

/**
 * Partner block. Restrained by design: a short description, the official
 * banner where the partner provides one, and the affiliate disclosure — no
 * countdowns, no discount shouting.
 */
export function PartnerHighlight({ partner }: { partner: PartnerDTO }) {
  const href = safeExternalUrl(partner.url);
  const host = href ? displayHost(href) : null;

  return (
    <div className="card-surface overflow-hidden">
      <div className="p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xl">
            {partner.image ? (
              <Image
                src={partner.image.url}
                alt={partner.image.alt || `${partner.name} Logo`}
                width={160}
                height={40}
                className="mb-5 h-8 w-auto object-contain"
              />
            ) : null}

            {partner.description ? (
              <p className="text-[0.9375rem] leading-relaxed text-ink-300">
                {partner.description}
              </p>
            ) : null}
          </div>

          {href ? (
            <a
              href={href}
              target="_blank"
              rel="sponsored noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-ink-700 px-5 py-2.5 text-sm font-semibold text-ink-100 transition-colors hover:border-gold-500/50 hover:text-gold-400"
            >
              {host ?? "Zum Partner"}
              <FontAwesomeIcon icon={faUpRightFromSquare} className="size-3" aria-hidden />
            </a>
          ) : null}
        </div>

        {partner.integration === "instant-gaming" ? (
          <InstantGamingBanner
            affiliateId={partner.affiliateId}
            className="mt-7 overflow-hidden rounded-xl [&_img]:h-auto [&_img]:max-w-full [&_iframe]:max-w-full"
          />
        ) : null}

        {partner.disclosure ? (
          <p className="mt-6 border-t border-ink-800 pt-5 text-xs leading-relaxed text-ink-500">
            {partner.disclosure}
          </p>
        ) : null}
      </div>
    </div>
  );
}
