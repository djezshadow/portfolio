"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { Prisma } from "@prisma/client";
import { useTheme, resolveCategoryTheme } from "./theme-provider";
import { categoryStyleToCSS } from "@/lib/category-style";
import { loc, locOrNull } from "@/lib/i18n/content";
import { formatDateRange } from "@/lib/date-range";
import type { Locale } from "@/lib/i18n/dictionaries";
import { VideoEmbed } from "./video-embed";
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
  }, []);

  return (
    <div data-theme={resolvedTheme} className="min-h-screen px-6 py-16 transition-colors duration-500">
      <div className="mx-auto max-w-5xl">
        {isPreview && (
          <div className="glass mb-8 rounded-xl px-4 py-2 text-center font-mono text-[11px] text-accent">
            {dict.category.previewBanner}
          </div>
        )}
        <Reveal>
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
                <article
                  onClick={() =>
                    project.isComingSoon
                      ? setHintOpen({
                          title,
                          hint: locOrNull(project.comingSoonHint, project.comingSoonHintEn, locale),
                        })
                      : setOpenProjectId(project.id)
                  }
                  data-cursor="magnetic"
                  className={`glass cursor-pointer overflow-hidden rounded-2xl ${project.isComingSoon ? "grayscale opacity-60 saturate-0" : ""}`}
                >
                  <div className="relative">
                    {project.isComingSoon && (
                      <span className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-sm text-white">
                        🔒
                      </span>
                    )}
                    {coverMedia?.type === "video" && coverMedia.videoProvider && coverMedia.videoId ? (
                      <div className="pointer-events-none">
                        <VideoEmbed
                          provider={coverMedia.videoProvider}
                          videoId={coverMedia.videoId}
                          title={title}
                        />
                      </div>
                    ) : coverMedia?.url ? (
                      <div className="relative aspect-video w-full">
                        <Image
                          src={coverMedia.bakedThumbUrl || `/api/media/${coverMedia.id}?w=800`}
                          alt={title}
                          fill
                          className="object-cover"
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
                </article>
              </Reveal>
            );
          })}
        </div>

        {projects.length === 0 && (
          <p className="mt-12 font-mono text-sm text-[var(--ink-muted)]">{dict.category.empty}</p>
        )}
      </div>

      {openProject && (
        <ProjectLightbox
          project={{
            title: loc(openProject.title, openProject.titleEn, locale),
            role: locOrNull(openProject.role, openProject.roleEn, locale),
            description: locOrNull(openProject.description, openProject.descriptionEn, locale),
            collaboratorName: openProject.collaborator?.name,
            dateLabel: formatDateRange(openProject.dateStart, openProject.dateEnd, openProject.isOngoing, locale),
            media: openProject.media,
            groups: openProject.mediaGroups.map((g) => ({
              id: g.id,
              name: loc(g.name, g.nameEn, locale),
              coverImageUrl: g.coverImageUrl,
            })),
          }}
          onClose={() => setOpenProjectId(null)}
        />
      )}

      <AnimatePresence>
        {hintOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setHintOpen(null)}
            className="fixed inset-0 z-[210] flex items-center justify-center bg-black/60 p-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              onClick={(e) => e.stopPropagation()}
              className="nav-surface max-w-xs rounded-2xl p-6 text-center"
            >
              <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-accent">
                {locale === "en" ? "Coming soon" : "Próximamente"} 🔒
              </p>
              <h3 className="mb-3 font-display text-lg">{hintOpen.title}</h3>
              {hintOpen.hint && <p className="text-sm text-[var(--ink-muted)]">{hintOpen.hint}</p>}
              <button
                onClick={() => setHintOpen(null)}
                data-cursor="magnetic"
                className="mt-4 rounded-full bg-[var(--accent)] px-4 py-1.5 font-mono text-xs text-[var(--bg)]"
              >
                Cerrar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
