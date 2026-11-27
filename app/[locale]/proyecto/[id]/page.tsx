import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ProjectMedia } from "@/components/project-media";
import { formatDateRange } from "@/lib/date-range";
import { loc, locOrNull } from "@/lib/i18n/content";
import { prisma } from "@/lib/prisma";
import { projectPoster, publicProjectWhere } from "@/lib/public-projects";

type Props = { params: Promise<{ locale: string; id: string }> };
export const dynamic = "force-dynamic";

const findProject = cache((id: string) => prisma.project.findFirst({
  where: { id, ...publicProjectWhere() },
  include: {
    collaborator: { select: { id: true, name: true } },
    categories: { where: { category: { isComingSoon: false } }, include: { category: true } },
    media: { orderBy: [{ order: "asc" }, { id: "asc" }] },
    mediaGroups: { orderBy: { order: "asc" } },
  },
}));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, locale: language } = await params;
  const locale = language === "en" ? "en" : "es";
  const project = await findProject(id);
  if (!project) return {};
  const title = loc(project.title, project.titleEn, locale);
  const description = locOrNull(project.description, project.descriptionEn, locale) ?? undefined;
  const poster = projectPoster(project.media, "feature");
  return { title, description, openGraph: { title, description, images: poster ? [poster] : undefined } };
}

export default async function ProjectPage({ params }: Props) {
  const { id, locale: language } = await params;
  const locale = language === "en" ? "en" : "es";
  const en = locale === "en";
  const project = await findProject(id);
  if (!project) notFound();
  const title = loc(project.title, project.titleEn, locale);
  const role = locOrNull(project.role, project.roleEn, locale);
  const description = locOrNull(project.description, project.descriptionEn, locale);
  const behindScenes = locOrNull(project.behindScenes, project.behindScenesEn, locale);
  const category = project.categories[0]?.category;
  const poster = projectPoster([...project.media].sort((a, b) => Number(b.isThumbnail) - Number(a.isThumbnail)), "feature");
  return <article className="portfolio-page mx-auto max-w-6xl space-y-8 px-6 py-10 sm:space-y-12">
    <Link href={category ? `/${locale}/categoria/${category.slug}` : `/${locale}`} className="inline-flex min-h-11 items-center text-sm text-accent hover:underline">
      {category ? loc(category.name, category.nameEn, locale) : (en ? "Home" : "Inicio")}
    </Link>
    <header className="grid items-center gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      {poster && <div className="overflow-hidden rounded-2xl bg-neutral-900">
        <img src={poster} alt="" fetchPriority="high" className="aspect-[4/3] w-full object-cover" />
      </div>}
      <div className="space-y-4">
        {role && <p className="font-mono text-xs uppercase tracking-widest text-accent">{role}</p>}
        <h1 className="break-words font-display text-4xl leading-tight sm:text-6xl">{title}</h1>
        {description && <p className="whitespace-pre-line text-[var(--ink-muted)]">{description}</p>}
        {project.collaborator && <Link className="inline-flex min-h-11 items-center underline" href={`/${locale}/colaboradores/${project.collaborator.id}`}>
          {en ? "With" : "Con"} {project.collaborator.name}
        </Link>}
      </div>
    </header>
    <ProjectMedia en={en} project={{
      title, role, description, collaboratorName: project.collaborator?.name,
      dateLabel: formatDateRange(project.dateStart, project.dateEnd, project.isOngoing, locale),
      media: project.media.map(({ url, altText, altTextEn, ...media }) => ({
        ...media, url: media.type === "image" && url ? `/api/media/${media.id}` : "",
        alt: locOrNull(altText, altTextEn, locale) || undefined,
      })),
      groups: project.mediaGroups.map((group) => ({
        id: group.id, name: loc(group.name, group.nameEn, locale), coverImageUrl: group.coverImageUrl,
      })),
    }} />
    {behindScenes && <section className="max-w-3xl border-t border-[var(--glass-border)] pt-6">
      <h2 className="mb-3 font-display text-3xl">{en ? "Behind the scenes" : "Detrás de cámara"}</h2>
      <p className="whitespace-pre-line text-[var(--ink-muted)]">{behindScenes}</p>
    </section>}
  </article>;
}
