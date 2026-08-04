"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { put, del } from "@vercel/blob";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

async function assertAdmin() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  const valid = token ? await verifySessionToken(token) : false;
  if (!valid) throw new Error("No autorizado");
}

export type OptimizeResult = { ok: boolean; processed: number; skipped: number; error?: string };

export async function optimizeExistingPhotos(): Promise<OptimizeResult> {
  await assertAdmin();

  const images = await prisma.media.findMany({ where: { type: "image" } });
  let processed = 0;
  let skipped = 0;

  for (const media of images) {
    try {
      const res = await fetch(media.url);
      if (!res.ok) {
        skipped++;
        continue;
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      const metadata = await sharp(buffer).metadata();

      // Si ya es chica, no hace falta tocarla.
      if (!metadata.width || metadata.width <= 2400) {
        skipped++;
        continue;
      }

      const resized = await sharp(buffer)
        .resize({ width: 2400, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();

      const oldUrl = media.url;
      const blob = await put(`media/${media.projectId}-${media.id}-opt.webp`, resized, {
        access: "public",
        contentType: "image/webp",
      });

      await prisma.media.update({ where: { id: media.id }, data: { url: blob.url } });

      try {
        await del(oldUrl);
      } catch {
        // no pasa nada si ya no existe
      }

      processed++;
    } catch (err) {
      console.error(`Error optimizando media ${media.id}:`, err);
      skipped++;
    }
  }

  revalidatePath("/", "layout");
  return { ok: true, processed, skipped };
}
