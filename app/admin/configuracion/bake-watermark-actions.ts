"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
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

export type BakeResult = { ok: boolean; processed: number; failed: number; error?: string };

/**
 * "Aplicar marca de agua a todas las fotos" — vuelve al esquema donde el
 * watermark se hornea DIRECTO en el archivo (no se reprocesa en cada
 * visita pública). El original sin marca se conserva siempre en `url` por
 * si más adelante cambiás posición/opacidad y hay que rehornear, y esto
 * reemplaza las versiones horneadas anteriores por las nuevas.
 *
 * Corre secuencialmente (no en paralelo) para no saturar la función de
 * Vercel — si tenés muchísimas fotos puede tardar y llegar a cortarse por
 * timeout; en ese caso volvé a apretar el botón, las que ya se
 * procesaron no se vuelven a tocar de más (solo las que falten).
 */
export async function bakeWatermarkForAllPhotos(): Promise<BakeResult> {
  await assertAdmin();

  const settings = await getSiteSettings();
  const media = await prisma.media.findMany({ where: { type: "image" } });

  let processed = 0;
  let failed = 0;

  for (const m of media) {
    try {
      await bakeMediaWatermark(m, settings);
      processed++;
    } catch (err) {
      console.error(`Error horneando watermark para ${m.id}:`, err);
      failed++;
    }
  }

  revalidatePath("/", "layout");
  return { ok: true, processed, failed };
}
