"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button, Toast } from "@heroui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUpRightFromSquare,
  faBars,
  faChevronRight,
  faRightFromBracket,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

import { ADMIN_NAV, labelForPath } from "./nav";

type AdminShellProps = {
  identity: { name: string | null; email: string | null; image: string | null };
  children: React.ReactNode;
};

export function AdminShell({ identity, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const groups = ["Inhalte", "Website"] as const;

  async function signOut() {
    setIsSigningOut(true);
    try {
      await authClient.signOut();
    } finally {
      router.push("/");
      router.refresh();
    }
  }

  const sidebar = (
    // Closing on click keeps the mobile drawer in sync without an effect that
    // re-renders after every navigation.
    <nav
      aria-label="CMS-Navigation"
      className="flex h-full flex-col"
      onClick={() => setIsOpen(false)}
    >
      <div className="flex h-16 items-center gap-3 border-b border-ink-800 px-5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-gold-500 font-display text-sm font-bold text-ink-950">
          J
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-bold text-ink-100">Jannikjbi CMS</p>
          <p className="truncate text-[0.6875rem] text-ink-500">Content-Verwaltung</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-5">
        {groups.map((group) => (
          <div key={group} className="mb-6 last:mb-0">
            <p className="mb-2 px-3 text-[0.6875rem] font-semibold tracking-[0.14em] text-ink-500 uppercase">
              {group}
            </p>
            <ul className="space-y-0.5">
              {ADMIN_NAV.filter((item) => item.group === group).map((item) => {
                const isActive =
                  item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-ink-800 text-gold-400"
                          : "text-ink-300 hover:bg-ink-880 hover:text-ink-100",
                      )}
                    >
                      <FontAwesomeIcon icon={item.icon} className="size-4 shrink-0" aria-hidden />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-ink-800 p-3">
        <div className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2">
          {identity.image ? (
            <Image
              src={identity.image}
              alt=""
              width={32}
              height={32}
              className="size-8 shrink-0 rounded-full"
              unoptimized
            />
          ) : (
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink-800 text-xs font-semibold text-ink-300">
              {(identity.name ?? "?").charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink-100">
              {identity.name ?? "Angemeldet"}
            </p>
            {identity.email ? (
              <p className="truncate text-[0.6875rem] text-ink-500">{identity.email}</p>
            ) : null}
          </div>
        </div>

        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-400 transition-colors hover:bg-ink-880 hover:text-ink-100"
        >
          <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="size-3.5" aria-hidden />
          Website ansehen
        </Link>

        <button
          type="button"
          onClick={() => void signOut()}
          disabled={isSigningOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-400 transition-colors hover:bg-ink-880 hover:text-ink-100 disabled:opacity-60"
        >
          <FontAwesomeIcon icon={faRightFromBracket} className="size-3.5" aria-hidden />
          {isSigningOut ? "Wird abgemeldet …" : "Abmelden"}
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="hidden border-r border-ink-800 bg-ink-900 lg:sticky lg:top-0 lg:block lg:h-dvh">
        {sidebar}
      </aside>

      {isOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Menü schließen"
            className="absolute inset-0 bg-black/70"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 border-r border-ink-800 bg-ink-900">
            {sidebar}
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-ink-800 bg-ink-950/90 px-5 backdrop-blur-md lg:px-8">
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            aria-label="Menü öffnen"
            className="lg:hidden"
            onPress={() => setIsOpen(true)}
          >
            <FontAwesomeIcon icon={isOpen ? faXmark : faBars} className="size-4" aria-hidden />
          </Button>

          <nav aria-label="Breadcrumb" className="min-w-0">
            <ol className="flex items-center gap-2 text-sm">
              <li>
                <Link href="/admin" className="text-ink-400 transition-colors hover:text-ink-100">
                  CMS
                </Link>
              </li>
              {pathname !== "/admin" ? (
                <>
                  <li aria-hidden className="text-ink-600">
                    <FontAwesomeIcon icon={faChevronRight} className="size-2.5" />
                  </li>
                  <li className="truncate font-medium text-ink-100" aria-current="page">
                    {labelForPath(pathname)}
                  </li>
                </>
              ) : null}
            </ol>
          </nav>
        </header>

        <main className="flex-1 px-5 py-8 lg:px-8 lg:py-10">{children}</main>
      </div>

      <Toast.Provider placement="bottom end" />
    </div>
  );
}
