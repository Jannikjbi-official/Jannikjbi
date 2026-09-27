"use client";

import { useEffect, useRef, useState } from "react";

import { INSTANT_GAMING } from "@/lib/site";

declare global {
  interface Window {
    igBannerConfig?: {
      lang: string;
      igr: string;
      banners: string[];
    };
  }
}

type InstantGamingBannerProps = {
  /** Affiliate tag from the CMS; falls back to the configured default. */
  affiliateId?: string | null;
  className?: string;
};

/**
 * Official Instant Gaming partner banner.
 *
 * The loader script is injected here rather than in the root layout, so it is
 * only downloaded on the pages that actually show a banner. The config object
 * is assigned as a real property before the loader is appended — that ordering
 * is what the official integration requires, and assigning it directly (rather
 * than interpolating into an inline `<script>`) means a value coming from the
 * database can never be executed as code.
 */
export function InstantGamingBanner({ affiliateId, className }: InstantGamingBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const igr = (affiliateId || INSTANT_GAMING.affiliateId).trim();
    if (!igr) return;

    window.igBannerConfig = {
      lang: INSTANT_GAMING.lang,
      igr,
      banners: [INSTANT_GAMING.bannerClass],
    };

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${INSTANT_GAMING.loaderSrc}"]`,
    );

    if (existing) return;

    const script = document.createElement("script");
    script.src = INSTANT_GAMING.loaderSrc;
    script.defer = true;
    script.addEventListener("error", () => setFailed(true));
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, [affiliateId]);

  // If the partner script cannot load (blocked, offline), the section simply
  // renders nothing extra rather than an empty framed box.
  if (failed) return null;

  return (
    <div
      ref={containerRef}
      className={className}
      // The loader fills this element; `bannerClass` is the hook it looks for.
    >
      <div className={INSTANT_GAMING.bannerClass} />
    </div>
  );
}
