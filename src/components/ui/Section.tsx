import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SectionProps = {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * The one section rhythm the whole public site uses: small gold eyebrow,
 * large display heading, optional lead paragraph, optional action on the right.
 */
export function Section({
  id,
  eyebrow,
  title,
  description,
  action,
  children,
  className,
}: SectionProps) {
  return (
    <section id={id} className={cn("py-16 sm:py-20 lg:py-24", className)}>
      <div className="container-page">
        <div className="mb-8 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
          <div className="max-w-2xl">
            {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
            <h2 className="text-2xl font-bold sm:text-3xl lg:text-[2.125rem]">{title}</h2>
            {description ? (
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-300">{description}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
        {children}
      </div>
    </section>
  );
}
