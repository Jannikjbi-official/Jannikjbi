"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faXmark } from "@fortawesome/free-solid-svg-icons";

import { AVATAR, MAIN_NAV } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Public navigation. It contains no login entry, no admin links and nothing
 * that hints at the CMS — /login exists but is not advertised here.
 */
export function SiteHeader({ creatorName }: { creatorName: string }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Prevent the page behind the drawer from scrolling.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-ink-800/80 bg-ink-950/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4 lg:h-[4.5rem]">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg"
          aria-label={`${creatorName} – zur Startseite`}
        >
          <Image
            src={AVATAR.src}
            alt=""
            width={40}
            height={40}
            className="size-9 rounded-full ring-1 ring-ink-700"
            priority
          />
          <span className="font-display text-[0.9375rem] font-bold tracking-tight text-ink-100">
            {creatorName}
          </span>
        </Link>

        <nav aria-label="Hauptnavigation" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {MAIN_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "relative rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-200",
                    isActive(item.href)
                      ? "text-ink-100"
                      : "text-ink-300 hover:text-ink-100",
                  )}
                >
                  {item.label}
                  {isActive(item.href) ? (
                    <span
                      aria-hidden
                      className="absolute inset-x-3.5 -bottom-px h-0.5 rounded-full bg-gold-500"
                    />
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-controls="mobile-nav"
          className="flex size-10 items-center justify-center rounded-lg border border-ink-700 text-ink-200 transition-colors hover:border-ink-600 hover:text-ink-100 lg:hidden"
        >
          <FontAwesomeIcon icon={isOpen ? faXmark : faBars} className="size-4" aria-hidden />
          <span className="sr-only">{isOpen ? "Menü schließen" : "Menü öffnen"}</span>
        </button>
      </div>

      {isOpen ? (
        <nav
          id="mobile-nav"
          aria-label="Hauptnavigation (mobil)"
          className="border-t border-ink-800 bg-ink-950 lg:hidden"
        >
          {/* Closing on click (rather than in an effect on `pathname`) keeps the
              drawer in sync without an extra render pass after every navigation. */}
          <ul
            className="container-page flex flex-col py-3"
            onClick={() => setIsOpen(false)}
          >
            {MAIN_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-3 text-[0.9375rem] font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-ink-850 text-gold-400"
                      : "text-ink-200 hover:bg-ink-880",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
