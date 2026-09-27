import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { LoginPanel } from "@/components/admin/LoginPanel";
import { AVATAR } from "@/lib/site";

export const metadata: Metadata = {
  title: "Anmelden",
  robots: { index: false, follow: false, nocache: true },
};

/**
 * The login page exists but is not linked from the public navigation.
 * It says nothing about what lies behind it.
 */
export default function LoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src={AVATAR.src}
            alt=""
            aria-hidden
            width={64}
            height={64}
            className="size-14 rounded-full ring-1 ring-ink-700"
          />
          <h1 className="mt-5 font-display text-xl font-bold">Anmelden</h1>
          <p className="mt-2 text-sm text-ink-400">Wähle eine Anmeldemethode.</p>
        </div>

        <div className="card-surface p-6">
          <LoginPanel />
        </div>

        <p className="mt-6 text-center text-xs text-ink-600">
          <Link href="/" className="transition-colors hover:text-ink-300">
            Zurück zur Website
          </Link>
        </p>
      </div>
    </div>
  );
}
