import type { ReactNode } from "react";

export function MutedCell({ children }: { children: ReactNode }) {
  return <span className="text-sm text-ink-400">{children}</span>;
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={
        active
          ? "inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[0.6875rem] font-semibold text-emerald-300 uppercase"
          : "inline-flex items-center rounded-full border border-ink-600 bg-ink-800 px-2.5 py-1 text-[0.6875rem] font-semibold text-ink-400 uppercase"
      }
    >
      {active ? "Sichtbar" : "Versteckt"}
    </span>
  );
}

export function FeaturedBadge({ featured }: { featured: boolean }) {
  if (!featured) return <span className="text-sm text-ink-600">–</span>;

  return (
    <span className="inline-flex items-center rounded-full bg-gold-500 px-2.5 py-1 text-[0.6875rem] font-bold text-ink-950 uppercase">
      Featured
    </span>
  );
}
