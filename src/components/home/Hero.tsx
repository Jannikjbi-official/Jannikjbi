import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faCalendarDays } from "@fortawesome/free-solid-svg-icons";

import { ButtonLink } from "@/components/ui/ButtonLink";
import { SOCIAL_ICONS } from "@/lib/icons";
import { AVATAR } from "@/lib/site";
import type { SiteSettingsDTO, SocialLinkDTO, TwitchLiveDTO } from "@/lib/types";
import { SOCIAL_PLATFORM_LABELS } from "@/lib/content-constants";
import { safeExternalUrl } from "@/lib/utils";

type HeroProps = {
  settings: SiteSettingsDTO;
  live: TwitchLiveDTO | null;
  /** The two or three channels worth a direct jump from the hero. */
  quickLinks: SocialLinkDTO[];
};

export function Hero({ settings, live, quickLinks }: HeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-ink-850">
      {/* A single soft light source behind the headline — no particles, no grid. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-32 size-[34rem] rounded-full opacity-[0.07] blur-3xl"
        style={{ background: "radial-gradient(circle, var(--color-gold-500), transparent 68%)" }}
      />

      <div className="container-page relative grid gap-12 py-16 sm:py-20 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-16 lg:py-28">
        <div className="max-w-2xl">
          {live?.isLive ? (
            <a
              href={live.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-red-500/35 bg-red-500/10 py-1.5 pr-4 pl-3 text-sm font-medium text-red-300 transition-colors hover:border-red-500/60"
            >
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-70" />
                <span className="relative inline-flex size-2 rounded-full bg-red-500" />
              </span>
              Jetzt live
              {live.gameName ? (
                <span className="text-red-200/80">· {live.gameName}</span>
              ) : null}
            </a>
          ) : null}

          <h1 className="text-[2.25rem] leading-[1.08] font-bold sm:text-5xl lg:text-[3.5rem]">
            {settings.heroHeadline}
          </h1>

          <p className="mt-5 font-display text-base font-medium tracking-wide text-gold-500 sm:text-lg">
            {settings.heroSubline}
          </p>

          <p className="mt-5 max-w-xl text-[0.9375rem] leading-relaxed text-ink-300 sm:text-base">
            {settings.heroText}
          </p>

          {/* One primary action, one secondary, the rest as quiet links. */}
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <ButtonLink href="/games" variant="primary">
              Games entdecken
              <FontAwesomeIcon icon={faArrowRight} className="size-3.5" aria-hidden />
            </ButtonLink>

            <ButtonLink href="/content" variant="outline">
              <FontAwesomeIcon icon={faCalendarDays} className="size-3.5" aria-hidden />
              Streams ansehen
            </ButtonLink>

            <ButtonLink href="/projects" variant="ghost">
              Projekte
            </ButtonLink>
          </div>

          {quickLinks.length > 0 ? (
            <ul className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              {quickLinks.map((link) => {
                const href = safeExternalUrl(link.url);
                if (!href) return null;

                return (
                  <li key={link.id}>
                    <a
                      href={href}
                      target="_blank"
                      rel="me noopener noreferrer"
                      className="group inline-flex items-center gap-2 text-sm font-medium text-ink-400 transition-colors hover:text-ink-100"
                    >
                      <FontAwesomeIcon
                        icon={SOCIAL_ICONS[link.platform]}
                        className="size-4 text-ink-500 transition-colors group-hover:text-gold-500"
                        aria-hidden
                      />
                      {link.label || SOCIAL_PLATFORM_LABELS[link.platform]}
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>

        <div className="hidden lg:block">
          <div className="relative">
            <div
              aria-hidden
              className="absolute -inset-3 rounded-full border border-ink-800"
            />
            <Image
              src={AVATAR.src}
              alt={AVATAR.alt}
              width={AVATAR.width}
              height={AVATAR.height}
              priority
              sizes="280px"
              className="size-[17.5rem] rounded-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
