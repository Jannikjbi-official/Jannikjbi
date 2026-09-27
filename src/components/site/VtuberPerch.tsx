import Image from "next/image";

import { VTUBER } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * The avatar perched on the top edge of its container.
 *
 * The container must be `position: relative`. `.vtuber-perch` pins the image so
 * its feet land a little *below* that edge — the body rises above it and the
 * legs hang into the surface underneath, which is what makes it read as
 * sitting on the edge rather than floating next to it.
 *
 * It is decorative: `pointer-events: none` means it can never intercept a click
 * meant for the footer navigation, and the sizes are driven by the
 * `--vtuber-height` / `--vtuber-sink` custom properties so it scales down on
 * tablet and phone without ever widening the page.
 */
export function VtuberPerch({ className }: { className?: string }) {
  return (
    <Image
      src={VTUBER.src}
      alt=""
      aria-hidden
      width={VTUBER.width}
      height={VTUBER.height}
      priority={false}
      sizes="(min-width: 1280px) 220px, (min-width: 1024px) 186px, (min-width: 640px) 131px, 95px"
      className={cn("vtuber-perch vtuber-perch--right", className)}
    />
  );
}

/** Keeps the section above the footer clear of the part that rises above it. */
export function VtuberSpacer() {
  return <div className="vtuber-spacer" aria-hidden />;
}
