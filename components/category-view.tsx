"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { PortfolioDialog } from "./portfolio-dialog";
import type { Prisma } from "@prisma/client";
import { useTheme, resolveCategoryTheme } from "./theme-provider";
import { categoryStyleToCSS } from "@/lib/category-style";
import { loc, locOrNull } from "@/lib/i18n/content";
import { formatDateRange } from "@/lib/date-range";
import type { Locale } from "@/lib/i18n/dictionaries";
import { getVideoThumbnail } from "@/lib/video-url";
import { ProjectLightbox } from "./project-lightbox";
import { Reveal } from "./reveal";
import Image from "next/image";

type CategoryWithData = Prisma.CategoryGetPayload<{
  include: {
    style: true;
    projects: {
      include: {
        project: {
          include: { media: true; mediaGroups: true; collaborator: true };
        };
      };
    };
  };
}>;

type Dict = {
  category: { previewBanner: string; empty: string; with: string };
};

export function CategoryView({
  category,
  isPreview = false,
  dict,
  locale,
}: {
  category: CategoryWithData;
  isPreview?: boolean;
  dict: Dict;
  locale: Locale;
}) {
  const { theme: globalTheme } = useTheme();
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);
  const [hintOpen, setHintOpen] = useState<{ title: string; hint: string | null } | null>(null);

  const resolvedTheme = resolveCategoryTheme(globalTheme, {
    mode: category.themeMode,
    theme: category.themeName ?? undefined,
  });

  const titleStyle = categoryStyleToCSS(category.style);
  const projects = category.projects.map((pc) => pc.project);
  const categoryName = loc(category.name, category.nameEn, locale);
  const openProject = projects.find((p) => p.id === openProjectId) ?? null;

  // Acceso directo desde la navbar (?proyecto=<id>) — si el proyecto
  // está en pausa, muestra la pista en vez de abrirlo directo.
  const searchParams = useSearchParams();
  useEffect(() => {
    const wanted = searchParams.get("proyecto");
    if (!wanted) return;
    const target = projects.find((p) => p.id === wanted);
    if (!target) return;
    if (target.isComingSoon) {
      setHintOpen({
        title: loc(target.title, target.titleEn, locale),
        hint: locOrNull(target.comingSoonHint, target.comingSoonHintEn, locale),
      });
    } else {
      setOpenProjectId(target.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, category.projects, locale]);

  return (
    <div data-theme={resolvedTheme} className="min-h-screen py-16 transition-colors duration-500">
      <div className="portfolio-page mx-auto max-w-[67rem] px-6">
        {isPreview && (
          <div className="glass mb-8 rounded-xl px-4 py-2 text-center font-mono text-[11px] text-accent">
            {dict.category.previewBanner}
          </div>
        )}
        <Reveal className="text-center sm:text-left">
          <span className="font-mono text-[11px] text-[var(--ink-muted)]">
            {resolvedTheme === "neon" ? "NEÓN" : "NOIR"} · {category.themeMode === "auto" ? "AUTO" : "MANUAL"}
          </span>
          <h1 className="mt-1 font-display text-4xl sm:text-5xl" style={titleStyle}>
            {categoryName}
          </h1>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2">
          {projects.map((project, i) => {
            const title = loc(project.title, project.titleEn, locale);
            const description = locOrNull(project.description, project.descriptionEn, locale);
            const role = locOrNull(project.role, project.roleEn, locale);
            const dateLabel = formatDateRange(project.dateStart, project.dateEnd, project.isOngoing, locale);
            const extraCount = project.media.length - 1;
            const coverMedia = project.media.find((m) => m.isThumbnail) ?? project.media[0];

            return (
              <Reveal key={project.id} delay={i * 0.05}>
                <article className={`glass group relative overflow-hidden rounded-2xl focus-within:ring-2 focus-within:ring-accent ${project.isComingSoon ? "grayscale opacity-60 saturate-0" : ""}`}>
                  <div className="relative">
                    {project.isComingSoon && (
                      <span className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-sm text-white">
                        🔒
                      </span>
                    )}
                    {coverMedia?.type === "video" && coverMedia.videoProvider && coverMedia.videoId ? (
                      <div className="relative grid aspect-video place-items-center bg-black/30">
                        {coverMedia.videoProvider === "youtube" && (
                          <img src={getVideoThumbnail("youtube", coverMedia.videoId) ?? undefined} alt="" loading="lazy"
                            className="absolute inset-0 h-full w-full object-cover" />
                        )}
                        <span aria-hidden className="relative rounded-full bg-black/70 px-4 py-2 text-white">▶</span>
                      </div>
                    ) : coverMedia?.url ? (
                      <div className="relative aspect-video w-full">
                        <Image
                          src={coverMedia.bakedThumbUrl || `/api/media/${coverMedia.id}?w=800`}
                          alt={title}
                          fill
                          className="object-cover motion-safe:transition-transform motion-safe:group-hover:scale-[1.03]"
                          sizes="(max-width: 640px) 100vw, 50vw"
                          unoptimized
                        />
                      </div>
                    ) : null}

                    {extraCount > 0 && (
                      <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-1 font-mono text-[10px] text-white">
                        +{extraCount} más
                      </span>
                    )}
                  </div>

                  <div className="p-5">
                    <span className="font-mono text-[11px] text-accent">{role ?? "—"}</span>
                    {dateLabel && (
                      <span className="ml-2 font-mono text-[11px] text-[var(--ink-muted)]">{dateLabel}</span>
                    )}
                    <h2 className="font-display text-xl">{title}</h2>
                    {description && (
                      <p className="mt-1 text-sm text-[var(--ink-muted)]">{description}</p>
                    )}
                    {project.collaborator && (
                      <p className="mt-3 font-mono text-[11px] text-[var(--ink-muted)]">
                        {dict.category.with} {project.collaborator.name}
                      </p>
                    )}
                  </div>
                  <button type="button" aria-label={title} aria-haspopup="dialog" data-cursor="magnetic"
                    className="absolute inset-0 z-20 cursor-pointer"
                    onClick={() => project.isComingSoon
                      ? setHintOpen({ title, hint: locOrNull(project.comingSoonHint, project.comingSoonHintEn, locale) })
                      : setOpenProjectId(project.id)} />
                </article>
              </Reveal>
            );
          })}
        </div>

        {projects.length === 0 && (
          <p className="mt-12 font-mono text-sm text-[var(--ink-muted)]">{dict.category.empty}</p>
        )}
      </div>

      <AnimatePresence>
      {openProject && (
        <ProjectLightbox
          key={openProject.id}
          project={{
            title: loc(openProject.title, openProject.titleEn, locale),
            role: locOrNull(openProject.role, openProject.roleEn, locale),
            description: locOrNull(openProject.description, openProject.descriptionEn, locale),
            collaboratorName: openProject.collaborator?.name,
            dateLabel: formatDateRange(openProject.dateStart, openProject.dateEnd, openProject.isOngoing, locale),
            media: openProject.media.map((m) => ({
              ...m,
              alt: locOrNull(m.altText, m.altTextEn, locale) || undefined,
            })),
            groups: openProject.mediaGroups.map((g) => ({
              id: g.id,
              name: loc(g.name, g.nameEn, locale),
              coverImageUrl: g.coverImageUrl,
            })),
          }}
          onClose={() => setOpenProjectId(null)}
        />
      )}

      </AnimatePresence>
      {hintOpen && <PortfolioDialog title={hintOpen.title} onClose={() => setHintOpen(null)} closeLabel={locale === "en" ? "Close" : "Cerrar"}>
        {hintOpen.hint && <p className="text-sm">{hintOpen.hint}</p>}
      </PortfolioDialog>}
    </div>
  );
}
