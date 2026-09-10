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

/**
 * Sube una foto para el carrusel de Novedades (pedido: "dejame añadir
 * una foto personalizada porque no todo le carga foto") — se usa tanto
 * para el override de un ítem automático como para una entrada manual.
 * 800x450 alcanza de sobra para una tarjeta del carrusel; no hace falta
 * más resolución.
 */
async function uploadUpdatesFeedImage(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const webp = await sharp(buffer).resize({ width: 800, height: 450, fit: "cover" }).webp({ quality: 85 }).toBuffer();
  const blob = await put(`updates-feed/${Date.now()}.webp`, webp, { access: "public", contentType: "image/webp" });
  return blob.url;
}

/**
 * Guarda la corrección de UN ítem automático puntual (pedido: "que
 * pueda modificarlo si algo no me gusta") — ocultarlo del todo, pisarle
 * el título/descripción, o ponerle/sacarle una foto propia. Si se manda
 * todo vacío y sin ocultar ni foto, se borra el override (vuelve a
 * mostrarse tal cual lo automático).
 */
export async function saveAutoFeedOverride(
  sourceType: "project" | "category" | "instagram",
  sourceId: string,
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  await assertAdmin();

  const hidden = formData.get("hidden") === "on";
  const titleOverride = (formData.get("titleOverride") as string)?.trim() || null;
  const titleOverrideEn = (formData.get("titleOverrideEn") as string)?.trim() || null;
  const descriptionOverride = (formData.get("descriptionOverride") as string)?.trim() || null;
  const descriptionOverrideEn = (formData.get("descriptionOverrideEn") as string)?.trim() || null;
  const removeImage = formData.get("removeImage") === "on";
  const image = formData.get("image") as File | null;

  const current = await prisma.updateFeedOverride.findUnique({ where: { sourceType_sourceId: { sourceType, sourceId } } });
  let imageUrlOverride = current?.imageUrlOverride ?? null;

  try {
    if (removeImage && imageUrlOverride) {
      try {
        await del(imageUrlOverride);
      } catch {
        // ignorar
      }
      imageUrlOverride = null;
    }
    if (image && image.size > 0) {
      if (imageUrlOverride) {
        try {
          await del(imageUrlOverride);
        } catch {
          // ignorar
        }
      }
      imageUrlOverride = await uploadUpdatesFeedImage(image);
    }

    const isEmpty =
      !hidden && !titleOverride && !titleOverrideEn && !descriptionOverride && !descriptionOverrideEn && !imageUrlOverride;

    if (isEmpty) {
      await prisma.updateFeedOverride.deleteMany({ where: { sourceType, sourceId } });
    } else {
      await prisma.updateFeedOverride.upsert({
        where: { sourceType_sourceId: { sourceType, sourceId } },
        update: { hidden, titleOverride, titleOverrideEn, descriptionOverride, descriptionOverrideEn, imageUrlOverride },
        create: {
          sourceType,
          sourceId,
          hidden,
          titleOverride,
          titleOverrideEn,
          descriptionOverride,
          descriptionOverrideEn,
          imageUrlOverride,
        },
      });
    }
  } catch (err) {
    console.error("Error en saveAutoFeedOverride:", err);
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo guardar." };
  }

  revalidatePath("/admin/novedades");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateUpdatesFeedSettings(formData: FormData) {
  await assertAdmin();

  const updatesFeedEnabled = formData.get("updatesFeedEnabled") === "on";
  const updatesFeedTitle = (formData.get("updatesFeedTitle") as string)?.trim() || null;
  const updatesFeedTitleEn = (formData.get("updatesFeedTitleEn") as string)?.trim() || null;
  const validSpeeds = ["detenido", "lento", "normal", "rapido"];
  const rawSpeed = (formData.get("updatesFeedSpeed") as string) || "normal";
  const updatesFeedSpeed = validSpeeds.includes(rawSpeed) ? rawSpeed : "normal";
  const rawVisible = Number(formData.get("updatesFeedVisible"));
  const updatesFeedVisible = Number.isFinite(rawVisible) && rawVisible >= 1 && rawVisible <= 6 ? Math.round(rawVisible) : 3;

  await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: { updatesFeedEnabled, updatesFeedTitle, updatesFeedTitleEn, updatesFeedSpeed, updatesFeedVisible },
    create: {
      id: "default",
      updatesFeedEnabled,
      updatesFeedTitle,
      updatesFeedTitleEn,
      updatesFeedSpeed,
      updatesFeedVisible,
    },
  });

  revalidatePath("/admin/novedades");
  revalidatePath("/", "layout");
}

export async function createUpdateEntry(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  await assertAdmin();

  const title = (formData.get("title") as string)?.trim();
  if (!title) return { ok: false, error: "Falta el título." };
  const titleEn = (formData.get("titleEn") as string)?.trim() || null;
  const description = (formData.get("description") as string)?.trim() || null;
  const descriptionEn = (formData.get("descriptionEn") as string)?.trim() || null;
  const rawDate = formData.get("date") as string;
  const date = rawDate ? new Date(rawDate) : new Date();
  const image = formData.get("image") as File | null;

  let imageUrl: string | null = null;
  try {
    if (image && image.size > 0) {
      imageUrl = await uploadUpdatesFeedImage(image);
    }
    const count = await prisma.updateLogEntry.count();
    await prisma.updateLogEntry.create({
      data: { title, titleEn, description, descriptionEn, date, order: count, imageUrl },
    });
  } catch (err) {
    console.error("Error en createUpdateEntry:", err);
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo guardar." };
  }

  revalidatePath("/admin/novedades");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateUpdateEntry(entryId: string, formData: FormData): Promise<{ ok: boolean; error?: string }> {
  await assertAdmin();

  const title = (formData.get("title") as string)?.trim();
  if (!title) return { ok: false, error: "Falta el título." };
  const titleEn = (formData.get("titleEn") as string)?.trim() || null;
  const description = (formData.get("description") as string)?.trim() || null;
  const descriptionEn = (formData.get("descriptionEn") as string)?.trim() || null;
  const rawDate = formData.get("date") as string;
  const date = rawDate ? new Date(rawDate) : undefined;
  const removeImage = formData.get("removeImage") === "on";
  const image = formData.get("image") as File | null;

  try {
    const current = await prisma.updateLogEntry.findUnique({ where: { id: entryId } });
    let imageUrl = current?.imageUrl ?? null;

    if (removeImage && imageUrl) {
      try {
        await del(imageUrl);
      } catch {
        // ignorar
      }
      imageUrl = null;
    }
    if (image && image.size > 0) {
      if (imageUrl) {
        try {
          await del(imageUrl);
        } catch {
          // ignorar
        }
      }
      imageUrl = await uploadUpdatesFeedImage(image);
    }

    await prisma.updateLogEntry.update({
      where: { id: entryId },
      data: { title, titleEn, description, descriptionEn, imageUrl, ...(date ? { date } : {}) },
    });
  } catch (err) {
    console.error("Error en updateUpdateEntry:", err);
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo guardar." };
  }

  revalidatePath("/admin/novedades");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteUpdateEntry(entryId: string, _formData: FormData) {
  await assertAdmin();
  const entry = await prisma.updateLogEntry.findUnique({ where: { id: entryId } });
  if (entry?.imageUrl) {
    try {
      await del(entry.imageUrl);
    } catch {
      // ignorar
    }
  }
  await prisma.updateLogEntry.delete({ where: { id: entryId } });
  revalidatePath("/admin/novedades");
  revalidatePath("/", "layout");
}

export async function moveUpdateEntry(entryId: string, direction: "up" | "down") {
  await assertAdmin();

  const all = await prisma.updateLogEntry.findMany({ orderBy: { order: "asc" }, select: { id: true, order: true } });
  const idx = all.findIndex((e) => e.id === entryId);
  if (idx === -1) return;
  const swapWith = direction === "up" ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= all.length) return;

  await prisma.$transaction([
    prisma.updateLogEntry.update({ where: { id: all[idx].id }, data: { order: all[swapWith].order } }),
    prisma.updateLogEntry.update({ where: { id: all[swapWith].id }, data: { order: all[idx].order } }),
  ]);

  revalidatePath("/admin/novedades");
  revalidatePath("/", "layout");
}

/**
 * Reordena todas las entradas de una — pedido: "poder arrastrar para
 * acomodar la posición" (mismo patrón que fotos e Instagram).
 */
export async function reorderUpdateEntries(orderedIds: string[]) {
  await assertAdmin();
  if (orderedIds.length === 0) return;

  await prisma.$transaction(
    orderedIds.map((id, index) => prisma.updateLogEntry.update({ where: { id }, data: { order: index } }))
  );

  revalidatePath("/admin/novedades");
  revalidatePath("/", "layout");
}
