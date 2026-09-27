import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { getSiteSettings } from "@/server/content/settings";
import { listPublicSocialLinks } from "@/server/content/socials";

/** Chrome shared by every public page. The CMS and /login sit outside it. */
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [settings, socialLinks] = await Promise.all([
    getSiteSettings(),
    listPublicSocialLinks(),
  ]);

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#inhalt"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[100] focus:rounded-lg focus:bg-gold-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink-950"
      >
        Zum Inhalt springen
      </a>

      <SiteHeader creatorName={settings.creatorName} />

      <main id="inhalt" className="flex-1">
        {children}
      </main>

      <SiteFooter settings={settings} socialLinks={socialLinks} />
    </div>
  );
}
