"use server";

import { revalidatePath } from "next/cache";
import { put, del } from "@vercel/blob";
import { Prisma } from "@prisma/client";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/private-albums";
import { isManagedBlob } from "@/lib/managed-blob";
import { getSiteSettings } from "@/lib/site-settings";
import { bakeMediaWatermark } from "@/lib/watermark-bake";

export type OptimizeResult = {
  converted: number;
  deleted: number;
  skipped: number;
  errors: string[];
  cursor: string | null;
};

const fields = [
  ["Media", "url"], ["Media", "bakedThumbUrl"], ["Media", "bakedFullUrl"],
  ["Category", "coverImageUrl"], ["MediaGroup", "coverImageUrl"],
  ["Collaborator", "logoUrl"], ["Project", "logoUrl"],
  ["Profile", "photoUrl"], ["InstagramPost", "coverImageUrl"],
  ["UpdateLogEntry", "imageUrl"], ["UpdateFeedOverride", "imageUrlOverride"],
  ["SiteSettings", "aboutImageUrl"], ["SiteSettings", "notFoundImageUrl"],
] as const;

// Only identifiers from the fixed list above enter these queries.
const references = Prisma.join(fields.map(([table, column]) => Prisma.sql`
  SELECT ${Prisma.raw(`"${column}"`)} AS url FROM ${Prisma.raw(`"${table}"`)}
`), " UNION ALL ");

const protectedReferences = Prisma.sql`
  ${references}
  UNION ALL SELECT "watermarkUrl" FROM "SiteSettings"
  UNION ALL SELECT "logoNoirUrl" FROM "SiteSettings"
  UNION ALL SELECT "logoNeonUrl" FROM "SiteSettings"
  UNION ALL SELECT "loadingAnimationUrl" FROM "SiteSettings"
`;

export async function optimizeExistingPhotos(after: string | null = null): Promise<OptimizeResult> {
  if (!(await isAdmin())) throw new Error("No autorizado");
  const result: OptimizeResult = { converted: 0, deleted: 0, skipped: 0, errors: [], cursor: null };
  if (!after) {
    const pending = await prisma.photoOriginalCleanup.findMany({ take: 4, orderBy: { url: "asc" } });
    for (const { url } of pending) await cleanOriginal(url, result);
  }

  const rows = await prisma.$queryRaw<{ url: string }[]>`
    SELECT DISTINCT url FROM (${references}) AS photos
    WHERE url > ${after ?? ""}
    ORDER BY url LIMIT 5
  `;

  for (const { url } of rows.slice(0, 4)) {
    if (!isManagedBlob(url) || /\.webp$/i.test(url)) {
      result.skipped++;
      continue;
    }

    try {
      const response = await fetch(url, { cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error("No se pudo leer la foto");
      const source = Buffer.from(await response.arrayBuffer());
      const image = sharp(source, { limitInputPixels: 100_000_000 });
      const metadata = await image.metadata();
      if (!metadata.format || !["jpeg", "png", "webp", "tiff", "heif", "gif"].includes(metadata.format) || (metadata.pages ?? 1) > 1) {
        result.skipped++;
        continue;
      }
      const output = await image.rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 84 }).toBuffer();
      const replacement = await put("media/optimized/photo.webp", output, {
        access: "public", contentType: "image/webp", addRandomSuffix: true,
      });

      const changed = await prisma.$transaction(async (tx) => {
        let count = 0;
        for (const [table, column] of fields) {
          const field = Prisma.raw(`"${column}"`);
          count += await tx.$executeRaw`UPDATE ${Prisma.raw(`"${table}"`)} SET ${field} = ${replacement.url} WHERE ${field} = ${url}`;
        }
        if (count) await tx.photoOriginalCleanup.upsert({ where: { url }, create: { url }, update: {} });
        return count;
      });
      if (changed) {
        result.converted++;
        await cleanOriginal(url, result);
      } else {
        await del(replacement.url);
        result.skipped++;
      }
    } catch (error) {
      console.error("Error convirtiendo foto", url, error);
      result.errors.push(`No se pudo convertir ${new URL(url).pathname}`);
    }
  }

  if (rows.length > 4) result.cursor = rows[3].url;
  if (result.converted) revalidatePath("/", "layout");
  return result;
}

export async function refreshPhotoWatermarks(after: string | null): Promise<OptimizeResult> {
  if (!(await isAdmin())) throw new Error("No autorizado");
  const result: OptimizeResult = { converted: 0, deleted: 0, skipped: 0, errors: [], cursor: null };
  const [images, settings] = await Promise.all([
    prisma.media.findMany({ where: { type: "image", id: { gt: after ?? "" } }, orderBy: { id: "asc" }, take: 3 }),
    getSiteSettings(),
  ]);
  for (const image of images.slice(0, 2)) {
    try {
      await bakeMediaWatermark(image, settings);
      result.converted++;
    } catch (error) {
      console.error("Error actualizando la marca de agua", image.id, error);
      result.errors.push(`No se pudo actualizar la foto ${image.id}`);
    }
  }
  if (images.length > 2) result.cursor = images[1].id;
  if (result.converted) revalidatePath("/", "layout");
  return result;
}

async function cleanOriginal(url: string, result: OptimizeResult) {
  try {
    const [reference] = await prisma.$queryRaw<{ url: string }[]>`
      SELECT url FROM (${protectedReferences}) AS photos WHERE url = ${url} LIMIT 1
    `;
    if (reference || !isManagedBlob(url)) return;
    await del(url);
    await prisma.photoOriginalCleanup.deleteMany({ where: { url } });
    result.deleted++;
  } catch (error) {
    console.error("Original pendiente de borrar", url, error);
    result.errors.push(`Quedó pendiente borrar ${url}`);
  }
}
