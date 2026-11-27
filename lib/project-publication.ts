import type { Prisma } from "@prisma/client";
import { after } from "next/server";
import { del } from "@vercel/blob";
import { projectWebp, isManagedBlob } from "@/lib/managed-blob";
import { parseVideoUrl } from "@/lib/video-url";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/site-settings";
import { bakeMediaWatermark } from "@/lib/watermark-bake";

export function projectEditorialFields(form: FormData) {
  const rankValue = String(form.get("featuredRank") ?? "").trim();
  const rank = rankValue ? Number(rankValue) : NaN;
  return {
    featuredRank: Number.isSafeInteger(rank) && rank >= 1 && rank <= 999 ? rank : null,
    behindScenes: String(form.get("behindScenes") ?? "").trim().slice(0, 6000) || null,
    behindScenesEn: String(form.get("behindScenesEn") ?? "").trim().slice(0, 6000) || null,
  };
}

export function readProjectMedia(form: FormData): Prisma.MediaCreateWithoutProjectInput[] {
  const photos = [...new Set(form.getAll("uploadedImageUrls").map(String).filter(Boolean))];
  const watermarkEnabled = form.get("watermarkEnabled") === "on";
  const media: Prisma.MediaCreateWithoutProjectInput[] = photos.map((url) => ({
    type: "image", url: projectWebp(url), watermarkEnabled,
  }));
  for (const value of form.getAll("videoUrls")) {
    const url = String(value).trim();
    if (!url) continue;
    const video = parseVideoUrl(url);
    if (!video) throw new Error("Revisá los enlaces de video. Usá una URL válida de YouTube o Vimeo.");
    media.push({ type: "video", url: "", videoProvider: video.provider, videoId: video.videoId });
  }
  return media;
}

export function finishProjectMedia(projectId: string, imageUrls: string[], remove: string[] = []) {
  if (!imageUrls.length && !remove.length) return;
  after(async () => {
    try {
      for (const url of new Set(remove)) {
        if (!isManagedBlob(url)) continue;
        const used = await prisma.media.findFirst({
          where: { OR: [{ url }, { bakedThumbUrl: url }, { bakedFullUrl: url }] }, select: { id: true },
        });
        if (!used) await del(url).catch((error) => console.error("No se pudo eliminar un archivo del proyecto", error));
      }
      if (!imageUrls.length) return;
      const [images, settings] = await Promise.all([
        prisma.media.findMany({ where: { projectId, type: "image", url: { in: imageUrls } } }),
        getSiteSettings(),
      ]);
      for (let i = 0; i < images.length; i += 2) {
        await Promise.allSettled(images.slice(i, i + 2).map((image) => bakeMediaWatermark(image, settings)));
      }
    } catch (error) {
      console.error("No se pudieron terminar de preparar las fotos del proyecto", projectId, error);
    }
  });
}
