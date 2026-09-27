import type { Metadata } from "next";
import Image from "next/image";

import { SocialCard } from "@/components/home/SocialCard";
import { AVATAR } from "@/lib/site";
import { toParagraphs } from "@/lib/utils";
import { getSiteSettings } from "@/server/content/settings";
import { listPublicSocialLinks } from "@/server/content/socials";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return {
    title: settings.aboutHeadline,
    description: settings.description,
    alternates: { canonical: "/about" },
  };
}

export default async function AboutPage() {
  const [settings, socials] = await Promise.all([getSiteSettings(), listPublicSocialLinks()]);

  const paragraphs = toParagraphs(settings.aboutText);

  return (
    <div className="py-14 sm:py-16 lg:py-20">
      <div className="container-page">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-16">
          <div className="max-w-2xl">
            <p className="eyebrow mb-3">Über mich</p>
            <h1 className="text-3xl font-bold sm:text-4xl lg:text-[2.75rem]">
              {settings.aboutHeadline}
            </h1>

            <div className="mt-8 space-y-5">
              {paragraphs.map((paragraph, index) => (
                <p
                  key={index}
                  className="text-[0.9375rem] leading-relaxed text-ink-300 sm:text-base"
                >
                  {paragraph}
                </p>
              ))}
            </div>

            {settings.contact.businessEmail || settings.contact.email ? (
              <div className="mt-10 card-surface p-6">
                <h2 className="font-display text-sm font-semibold text-ink-100">Kontakt</h2>
                {settings.contact.note ? (
                  <p className="mt-2 text-sm leading-relaxed text-ink-400">
                    {settings.contact.note}
                  </p>
                ) : null}
                <ul className="mt-4 space-y-2 text-sm">
                  {settings.contact.businessEmail ? (
                    <li>
                      <span className="text-ink-500">Business: </span>
                      <a
                        href={`mailto:${settings.contact.businessEmail}`}
                        className="font-medium text-ink-100 transition-colors hover:text-gold-400"
                      >
                        {settings.contact.businessEmail}
                      </a>
                    </li>
                  ) : null}
                  {settings.contact.email ? (
                    <li>
                      <span className="text-ink-500">Allgemein: </span>
                      <a
                        href={`mailto:${settings.contact.email}`}
                        className="font-medium text-ink-100 transition-colors hover:text-gold-400"
                      >
                        {settings.contact.email}
                      </a>
                    </li>
                  ) : null}
                </ul>
              </div>
            ) : null}
          </div>

          <div>
            <div className="sticky top-24">
              <Image
                src={AVATAR.src}
                alt={AVATAR.alt}
                width={AVATAR.width}
                height={AVATAR.height}
                sizes="(min-width: 1024px) 320px, 60vw"
                className="mx-auto size-48 rounded-full object-cover sm:size-60 lg:mx-0 lg:size-72"
              />

              {socials.length > 0 ? (
                <div className="mt-8 space-y-3">
                  {socials.slice(0, 4).map((link) => (
                    <SocialCard key={link.id} link={link} />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
