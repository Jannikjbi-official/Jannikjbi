import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faCalendarDays,
  faDiagramProject,
  faGamepad,
  faShareNodes,
} from "@fortawesome/free-solid-svg-icons";

import { GameCard } from "@/components/games/GameCard";
import { Hero } from "@/components/home/Hero";
import { NextStreamCard } from "@/components/home/NextStreamCard";
import { ProjectCard } from "@/components/home/ProjectCard";
import { SocialCard } from "@/components/home/SocialCard";
import { PartnerHighlight } from "@/components/partners/PartnerHighlight";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { Section } from "@/components/ui/Section";
import { listCurrentGames } from "@/server/content/games";
import { listFeaturedProjects, listPublicProjects } from "@/server/content/projects";
import { listPublicPartners } from "@/server/content/partners";
import { listPublicSocialLinks } from "@/server/content/socials";
import { getNextStream } from "@/server/content/streams";
import { getSiteSettings } from "@/server/content/settings";
import { getTwitchLiveStatus } from "@/server/content/twitch";

// Content is editable at any time; a short window keeps the page fast while the
// CMS additionally revalidates these paths on every write.
export const revalidate = 60;

export default async function HomePage() {
  const settings = await getSiteSettings();

  const [games, nextStream, live, featuredProjects, allProjects, socials, partners] =
    await Promise.all([
      listCurrentGames(6),
      getNextStream(),
      getTwitchLiveStatus(settings.twitchLogin),
      listFeaturedProjects(3),
      listPublicProjects(),
      listPublicSocialLinks(),
      listPublicPartners(),
    ]);

  // Featured projects if any are flagged, otherwise simply the first few.
  const projects = featuredProjects.length > 0 ? featuredProjects : allProjects.slice(0, 3);

  const quickLinks = socials.filter((link) =>
    ["twitch", "youtube"].includes(link.platform),
  );

  const partner = partners.find((entry) => entry.featured) ?? partners[0] ?? null;

  return (
    <>
      <Hero settings={settings} live={live} quickLinks={quickLinks} />

      {settings.sections.games ? (
        <Section
          eyebrow="Aktuell im Fokus"
          title="Games"
          description="Womit ich mich gerade beschäftige – von Simulationen über Aufbau bis Management."
          action={
            games.length > 0 ? (
              <ButtonLink href="/games" variant="outline" size="sm">
                Alle Games
                <FontAwesomeIcon icon={faArrowRight} className="size-3" aria-hidden />
              </ButtonLink>
            ) : null
          }
        >
          {games.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {games.map((game, index) => (
                <GameCard key={game.id} game={game} priority={index < 3} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={faGamepad}
              title="Noch keine Spiele vorhanden."
              description="Sobald Spiele im Dashboard angelegt sind, erscheinen sie hier automatisch."
            />
          )}
        </Section>
      ) : null}

      {settings.sections.stream ? (
        <>
          <div className="container-page">
            <div className="rule-fade" />
          </div>

          <Section
            eyebrow="Streamplan"
            title={live?.isLive ? "Gerade live" : "Nächster Stream"}
            description="Termine, Plattform und das Spiel dazu – alles aus meinem Streamplan."
            action={
              <ButtonLink href="/content" variant="outline" size="sm">
                Ganzer Plan
                <FontAwesomeIcon icon={faArrowRight} className="size-3" aria-hidden />
              </ButtonLink>
            }
          >
            {live?.isLive || nextStream ? (
              <NextStreamCard stream={nextStream} live={live} />
            ) : (
              <EmptyState
                icon={faCalendarDays}
                title="Aktuell ist kein Stream geplant."
                description="Neue Termine erscheinen hier, sobald sie im Streamplan eingetragen sind."
              />
            )}
          </Section>
        </>
      ) : null}

      {settings.sections.projects ? (
        <>
          <div className="container-page">
            <div className="rule-fade" />
          </div>

          <Section
            eyebrow="Eigene Arbeiten"
            title="Projekte"
            description="Digitale Projekte, die neben dem Content entstehen."
            action={
              projects.length > 0 ? (
                <ButtonLink href="/projects" variant="outline" size="sm">
                  Alle Projekte
                  <FontAwesomeIcon icon={faArrowRight} className="size-3" aria-hidden />
                </ButtonLink>
              ) : null
            }
          >
            {projects.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={faDiagramProject}
                title="Noch keine Projekte vorhanden."
                description="Projekte lassen sich im Dashboard anlegen und erscheinen dann hier."
              />
            )}
          </Section>
        </>
      ) : null}

      {settings.sections.socials ? (
        <>
          <div className="container-page">
            <div className="rule-fade" />
          </div>

          <Section
            eyebrow="Community"
            title="Social Media"
            description="Wo du mich sonst noch findest."
          >
            {socials.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {socials.map((link) => (
                  <SocialCard key={link.id} link={link} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={faShareNodes}
                title="Noch keine Social Links vorhanden."
                description="Kanäle lassen sich im Dashboard hinterlegen."
              />
            )}
          </Section>
        </>
      ) : null}

      {settings.sections.partners && partner ? (
        <>
          <div className="container-page">
            <div className="rule-fade" />
          </div>

          <Section eyebrow="Partner" title={partner.name}>
            <PartnerHighlight partner={partner} />
          </Section>
        </>
      ) : null}
    </>
  );
}
