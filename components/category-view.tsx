"use client";

import { useState } from "react";
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
          include: { media: true; collaborator: true };
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

  const resolvedTheme = resolveCategoryTheme(globalTheme, {
    mode: category.themeMode,
    theme: category.themeName ?? undefined,
  });

  const titleStyle = categoryStyleToCSS(category.style);
  const projects = category.projects.map((pc) => pc.project);
  const categoryName = loc(category.name, category.nameEn, locale);
  const openProject = projects.find((p) => p.id === openProjectId) ?? null;

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

            return (
              <Reveal key={project.id} delay={i * 0.05}>
                <article
                  onClick={() => setOpenProjectId(project.id)}
                  data-cursor="magnetic"
                  className="glass cursor-pointer overflow-hidden rounded-2xl"
                >
                  <div className="relative">
                    {project.media[0]?.type === "video" && project.media[0].videoProvider && project.media[0].videoId ? (
                      <div className="pointer-events-none">
                        <VideoEmbed
                          provider={project.media[0].videoProvider}
                          videoId={project.media[0].videoId}
                          title={title}
                        />
                      </div>
                    ) : project.media[0]?.url ? (
                      <div className="relative aspect-video w-full">
                        <Image
                          src={`/api/media/${project.media[0].id}`}
                          alt={title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, 50vw"
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
          }}
          onClose={() => setOpenProjectId(null)}
        />
      )}
    </div>
  );
}
