import Image from "next/image";
import type { Metadata } from "next";

import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { VTUBER } from "@/lib/site";
import { getSiteSettings } from "@/server/content/settings";
import { listPublicSocialLinks } from "@/server/content/socials";

export const metadata: Metadata = {
  title: "Seite nicht gefunden",
  robots: { index: false, follow: false },
};

/**
 * The site's 404 page.
 *
 * It is also what an unauthorized visitor gets for `/admin` and every admin
 * API route. That is deliberate: the response is an ordinary 404 with ordinary
 * site chrome, so nothing distinguishes "you may not see this" from "this does
 * not exist". No hint about authorization, about which account has access, or
 * that a private area exists at all.
 */
export default async function NotFound() {
  const [settings, socialLinks] = await Promise.all([
    getSiteSettings(),
    listPublicSocialLinks(),
  ]);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader creatorName={settings.creatorName} />

      <main className="flex flex-1 items-center">
        <div className="container-page py-16 sm:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
            <div className="max-w-xl">
              <p
                aria-hidden
                className="font-display text-[5.5rem] leading-none font-bold tracking-tighter text-ink-800 select-none sm:text-[8rem] lg:text-[10rem]"
              >
                404
              </p>

              <h1 className="-mt-2 text-2xl font-bold sm:text-3xl lg:text-4xl">
                Hier gibt es nichts zu sehen.
              </h1>

              <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-300">
                Die angeforderte Seite konnte nicht gefunden werden. Vielleicht wurde sie
                verschoben, umbenannt – oder es hat sich ein Tippfehler eingeschlichen.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/" variant="primary">
                  Zur Startseite
                </ButtonLink>
                <ButtonLink href="/games" variant="outline">
                  Games ansehen
                </ButtonLink>
              </div>
            </div>

            {/* The avatar stands beside the 404, unaltered. */}
            <div className="flex justify-center lg:justify-end">
              <Image
                src={VTUBER.src}
                alt=""
                aria-hidden
                width={VTUBER.width}
                height={VTUBER.height}
                sizes="(min-width: 1024px) 260px, 200px"
                className="vtuber-standing"
              />
            </div>
          </div>
        </div>
      </main>

      <SiteFooter settings={settings} socialLinks={socialLinks} />
    </div>
  );
}
