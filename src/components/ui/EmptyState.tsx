import type { ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: IconDefinition;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

/** Shown wherever a list has no entries — never a blank area. */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-700 bg-ink-900/60 px-6 py-14 text-center",
        className,
      )}
    >
      <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-ink-800 text-ink-400">
        <FontAwesomeIcon icon={icon} className="size-5" aria-hidden />
      </span>
      <p className="font-display text-base font-semibold text-ink-100">{title}</p>
      {description ? (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-400">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
