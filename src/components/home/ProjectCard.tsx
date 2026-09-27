import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";

import { ProjectStatusChip } from "@/components/ui/StatusChip";
import type { ProjectDTO } from "@/lib/types";
import { displayHost, safeExternalUrl } from "@/lib/utils";

export function ProjectCard({ project }: { project: ProjectDTO }) {
  const href = safeExternalUrl(project.url);
  const host = href ? displayHost(href) : null;

  const body = (
    <>
      {project.image ? (
        <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-ink-850">
          <Image
            src={project.image.url}
            alt={project.image.alt || `Vorschau von ${project.name}`}
            fill
            sizes="(min-width: 1024px) 380px, 92vw"
            className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
          />
        </div>
      ) : null}

      <div className={project.image ? "mt-5" : undefined}>
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-semibold text-ink-100 transition-colors group-hover:text-gold-400">
            {project.name}
          </h3>
          <ProjectStatusChip status={project.status} />
        </div>

        {project.category ? (
          <p className="mt-1.5 text-xs font-medium tracking-wide text-ink-500 uppercase">
            {project.category}
          </p>
        ) : null}

        <p className="mt-3 text-sm leading-relaxed text-ink-400">{project.description}</p>

        {host ? (
          <p className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-ink-300">
            {host}
            <FontAwesomeIcon icon={faUpRightFromSquare} className="size-3" aria-hidden />
          </p>
        ) : null}
      </div>
    </>
  );

  const className =
    "group card-surface block p-5 transition-colors duration-200 hover:border-ink-600";

  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {body}
    </a>
  ) : (
    <article className={className}>{body}</article>
  );
}
