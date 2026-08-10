import { put, del } from "@vercel/blob";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { applyWatermark } from "@/lib/watermark";
import type { getSiteSettings } from "@/lib/site-settings";

const THUMB_WIDTH = 800;
const FULL_WIDTH = 2000;

type Settings = Awaited<ReturnType<typeof getSiteSettings>>;

/**
 * Genera las dos versiones HORNEADAS (thumb 800px + full 2000px, watermark
 * ya aplicado adentro si corresponde) de una foto a partir de su original
 * sin marca, las sube al Blob, borra las versiones horneadas viejas (si
 * había) y actualiza la fila en la base. Usado tanto por "Aplicar a
 * todas las fotos" como automáticamente cada vez que subís una foto nueva.
 */
export async function bakeMediaWatermark(
  media: {
    id: string;
    url: string;
    watermarkEnabled: boolean;
    bakedThumbUrl?: string | null;
    bakedFullUrl?: string | null;
    watermarkPositionOverride?: string | null;
    watermarkOpacityOverride?: number | null;
  },
  settings: Settings
): Promise<void> {
  const res = await fetch(media.url);
  if (!res.ok) throw new Error(`No se pudo bajar el original de ${media.id}`);
  const original = Buffer.from(await res.arrayBuffer());

  async function renderAt(width: number): Promise<Buffer> {
    const resized = await sharp(original).resize({ width, withoutEnlargement: true }).toBuffer();

    if (media.watermarkEnabled) {
      const withMark = await applyWatermark(resized, {
        opacity: media.watermarkOpacityOverride ?? settings.watermarkOpacity,
        position: (media.watermarkPositionOverride ?? settings.watermarkPosition) as
          | "bottom-right"
          | "bottom-left"
          | "top-right"
          | "top-left"
          | "center",
        customLogoUrl: settings.watermarkUrl,
        scale: settings.watermarkScale,
      });
      return sharp(withMark).webp({ quality: 82 }).toBuffer();
    }
    return sharp(resized).webp({ quality: 82 }).toBuffer();
  }

  const [thumb, full] = await Promise.all([renderAt(THUMB_WIDTH), renderAt(FULL_WIDTH)]);

  const [thumbBlob, fullBlob] = await Promise.all([
    put(`media/baked/${media.id}-thumb-${Date.now()}.webp`, thumb, { access: "public", contentType: "image/webp" }),
    put(`media/baked/${media.id}-full-${Date.now()}.webp`, full, { access: "public", contentType: "image/webp" }),
  ]);

  const oldUrls = [media.bakedThumbUrl, media.bakedFullUrl].filter(Boolean) as string[];
  await Promise.allSettled(oldUrls.map((u) => del(u)));

  await prisma.media.update({
    where: { id: media.id },
    data: { bakedThumbUrl: thumbBlob.url, bakedFullUrl: fullBlob.url },
  });
}
