import type { Prisma } from "@prisma/client";
import { getVideoThumbnail } from "@/lib/video-url";
import { loc, locOrNull } from "@/lib/i18n/content";
import type { Locale } from "@/lib/i18n/dictionaries";

export function publicProjectWhere(): Prisma.ProjectWhereInput {
  return {
    publishedAt: { lte: new Date() },
    isComingSoon: false,
    categories: { some: { category: { isComingSoon: false } } },
  };
}

export const projectCoverSelect = {
  id: true, type: true, videoProvider: true, videoId: true,
} satisfies Prisma.MediaSelect;

export const workCardSelect = {
  id: true, title: true, titleEn: true, role: true, roleEn: true,
  media: { select: projectCoverSelect, orderBy: [{ isThumbnail: "desc" }, { order: "asc" }] },
} satisfies Prisma.ProjectSelect;

export function toWorkCard(project: Prisma.ProjectGetPayload<{ select: typeof workCardSelect }>, locale: Locale, size?: "feature") {
  return {
    id: project.id, title: loc(project.title, project.titleEn, locale),
    role: locOrNull(project.role, project.roleEn, locale),
    poster: projectPoster(project.media, size),
    video: project.media.some(({ type }) => type === "video"),
  };
}
type CoverMedia = Prisma.MediaGetPayload<{ select: typeof projectCoverSelect }>;

export function projectPoster(media: CoverMedia[], size: "card" | "feature" = "card") {
  const photo = media.find((item) => item.type === "image");
  if (photo) return `/api/project-cover/${photo.id}?size=${size}`;
  const video = media.find((item) => item.videoProvider && item.videoId);
  return video?.videoProvider && video.videoId ? getVideoThumbnail(video.videoProvider, video.videoId) : null;
}
