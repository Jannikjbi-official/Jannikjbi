import { cn } from "@/lib/utils";
import {
  GAME_STATUS_LABELS,
  PROJECT_STATUS_LABELS,
  type GameStatus,
  type ProjectStatus,
} from "@/lib/content-constants";

/** Muted by default; only the "currently played" state gets the accent. */
const GAME_STATUS_STYLES: Record<GameStatus, string> = {
  aktuell: "border-gold-500/35 bg-gold-500/10 text-gold-300",
  geplant: "border-ink-600 bg-ink-800 text-ink-200",
  pausiert: "border-ink-600 bg-ink-800 text-ink-400",
  beendet: "border-ink-700 bg-ink-850 text-ink-400",
};

const PROJECT_STATUS_STYLES: Record<ProjectStatus, string> = {
  live: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  wip: "border-gold-500/35 bg-gold-500/10 text-gold-300",
  konzept: "border-ink-600 bg-ink-800 text-ink-200",
  pausiert: "border-ink-600 bg-ink-800 text-ink-400",
  archiviert: "border-ink-700 bg-ink-850 text-ink-400",
};

const BASE =
  "inline-flex items-center rounded-full border px-2.5 py-1 text-[0.6875rem] font-semibold tracking-wide uppercase";

export function GameStatusChip({ status }: { status: GameStatus }) {
  return <span className={cn(BASE, GAME_STATUS_STYLES[status])}>{GAME_STATUS_LABELS[status]}</span>;
}

export function ProjectStatusChip({ status }: { status: ProjectStatus }) {
  return (
    <span className={cn(BASE, PROJECT_STATUS_STYLES[status])}>{PROJECT_STATUS_LABELS[status]}</span>
  );
}

export function GenreChip({ name, color }: { name: string; color?: string | null }) {
  const isHex = color ? /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color) : false;

  return (
    <span
      className="inline-flex items-center rounded-full border border-ink-650 bg-ink-800/80 px-2.5 py-1 text-xs font-medium text-ink-200"
      style={isHex ? { borderColor: `${color}55`, color: color as string } : undefined}
    >
      {name}
    </span>
  );
}
