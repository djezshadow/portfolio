"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { put, del } from "@vercel/blob";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { bakeMediaWatermark } from "@/lib/watermark-bake";
import { getSiteSettings } from "@/lib/site-settings";

async function assertAdmin() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  const valid = token ? await verifySessionToken(token) : false;
  if (!valid) throw new Error("No autorizado");
}

export type OptimizeResult = { ok: boolean; processed: number; skipped: number; error?: string };

/**
 * "Optimizar fotos ya subidas" — un solo botón que hace las dos cosas:
 * 1) Achica el ORIGINAL a 2400px máximo si venía más grande (menos peso
 *    guardado, más rápido de volver a procesar en el futuro).
 * 2) Hornea de nuevo las versiones públicas (bakedThumbUrl/bakedFullUrl)
 *    con el watermark actual ya IMPRESO en el archivo, comprimidas a
 *    WebP — nada se calcula en cada visita.
 *
 * Las fotos nuevas que subís de acá en más ya pasan por este mismo
 * proceso solas al subirlas (ver watermarkEnabled + bakeMediaWatermark en
 * las acciones de proyecto) — este botón es para ponerse al día con las
 * que ya estaban antes, o después de cambiar la config del watermark.
 */
export async function optimizeExistingPhotos(): Promise<OptimizeResult> {
  await assertAdmin();

  const watermarkSettings = await getSiteSettings();
  const images = await prisma.media.findMany({ where: { type: "image" } });
  let processed = 0;
  let skipped = 0;

  for (const media of images) {
    try {
      let mediaForBake = media;

      const res = await fetch(media.url);
      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer());
        const metadata = await sharp(buffer).metadata();

        // Solo re-subimos el original si venía más grande de lo necesario.
        if (metadata.width && metadata.width > 2400) {
          const resized = await sharp(buffer)
            .resize({ width: 2400, withoutEnlargement: true })
            .webp({ quality: 82 })
            .toBuffer();

          const oldUrl = media.url;
          const blob = await put(`media/${media.projectId}-${media.id}-opt.webp`, resized, {
            access: "public",
            contentType: "image/webp",
          });

          mediaForBake = await prisma.media.update({ where: { id: media.id }, data: { url: blob.url } });

          try {
            await del(oldUrl);
          } catch {
            // no pasa nada si ya no existe
          }
        }
      }

      // Siempre rehorneamos thumb+full con el watermark actual, aunque el
      // original no haya necesitado achicarse — es lo que pediste: que
      // "Optimizar" también deje el watermark ya impreso y comprimido.
      await bakeMediaWatermark(mediaForBake, watermarkSettings);
      processed++;
    } catch (err) {
      console.error(`Error optimizando media ${media.id}:`, err);
      skipped++;
    }
  }

  revalidatePath("/", "layout");
  return { ok: true, processed, skipped };
}
