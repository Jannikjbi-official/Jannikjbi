"use client";

import { useEffect } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@heroui/react";

/**
 * Route-level error boundary. Shows a short, human message — never the error
 * text, a stack trace or anything that could contain internal details.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] unhandled error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-5">
      <div className="max-w-md text-center">
        <span className="mx-auto mb-6 flex size-12 items-center justify-center rounded-full bg-ink-800 text-gold-500">
          <FontAwesomeIcon icon={faTriangleExclamation} className="size-5" aria-hidden />
        </span>

        <h1 className="font-display text-2xl font-bold">Da ist etwas schiefgelaufen.</h1>

        <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-300">
          Die Seite konnte nicht geladen werden. Versuche es erneut – wenn es weiterhin nicht
          klappt, schau später noch einmal vorbei.
        </p>

        <div className="mt-8 flex justify-center gap-3">
          <Button variant="primary" onPress={() => reset()}>
            Erneut versuchen
          </Button>
          <Link
            href="/"
            className="inline-flex items-center rounded-lg border border-ink-700 px-4 py-2 text-sm font-semibold text-ink-100 transition-colors hover:border-ink-600"
          >
            Zur Startseite
          </Link>
        </div>
      </div>
    </div>
  );
}
