import Link from "next/link";

import { LEGAL_NAV, MAIN_NAV } from "@/lib/site";
import type { SiteSettingsDTO, SocialLinkDTO } from "@/lib/types";

import { SocialIconLink } from "./SocialIconLink";
import { VtuberPerch, VtuberSpacer } from "./VtuberPerch";

type SiteFooterProps = {
  settings: SiteSettingsDTO;
  socialLinks: SocialLinkDTO[];
};

export function SiteFooter({ settings, socialLinks }: SiteFooterProps) {
  const year = new Date().getFullYear();

  return (
    // `overflow` stays visible here on purpose: the avatar rises above the
    // footer's top edge and must not be clipped. `html`/`body` clip the x-axis
    // instead, so this can never produce a horizontal scrollbar.
    <div className="relative">
      <VtuberSpacer />

      <footer className="relative border-t border-ink-800 bg-ink-900">
        <VtuberPerch />

        {/* The right padding keeps the footer columns clear of the figure. */}
        <div className="container-page relative z-[2] pt-12 pb-10 sm:pt-14 lg:pt-16">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_15rem] lg:gap-12">
            <div className="max-w-xs">
              <p className="font-display text-xl font-bold tracking-tight text-ink-100">
                {settings.creatorName}
              </p>
              <p className="mt-2 text-sm text-ink-400">{settings.footerText}</p>

              {socialLinks.length > 0 ? (
                <ul className="mt-6 flex flex-wrap gap-2">
                  {socialLinks.map((link) => (
                    <li key={link.id}>
                      <SocialIconLink link={link} />
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <nav aria-label="Footer-Navigation">
              <h2 className="font-display text-xs font-semibold tracking-[0.16em] text-ink-400 uppercase">
                Navigation
              </h2>
              <ul className="mt-4 space-y-2.5">
                {MAIN_NAV.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-ink-300 transition-colors hover:text-gold-400"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="Rechtliches">
              <h2 className="font-display text-xs font-semibold tracking-[0.16em] text-ink-400 uppercase">
                Rechtliches
              </h2>
              <ul className="mt-4 space-y-2.5">
                {LEGAL_NAV.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-ink-300 transition-colors hover:text-gold-400"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            {/* Reserves the column the figure's legs hang into. */}
            <div className="hidden lg:block" aria-hidden />
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-ink-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-ink-500">
              © {year} {settings.creatorName}. Alle Rechte vorbehalten.
            </p>
            <p className="text-xs text-ink-500">{settings.tagline}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
