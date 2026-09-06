"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

async function assertAdmin() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  const valid = token ? await verifySessionToken(token) : false;
  if (!valid) throw new Error("No autorizado");
}

export async function updateUpdatesFeedSettings(formData: FormData) {
  await assertAdmin();

  const updatesFeedEnabled = formData.get("updatesFeedEnabled") === "on";
  const updatesFeedTitle = (formData.get("updatesFeedTitle") as string)?.trim() || null;
  const updatesFeedTitleEn = (formData.get("updatesFeedTitleEn") as string)?.trim() || null;

  await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: { updatesFeedEnabled, updatesFeedTitle, updatesFeedTitleEn },
    create: { id: "default", updatesFeedEnabled, updatesFeedTitle, updatesFeedTitleEn },
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

  const count = await prisma.updateLogEntry.count();
  await prisma.updateLogEntry.create({
    data: { title, titleEn, description, descriptionEn, date, order: count },
  });

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

  await prisma.updateLogEntry.update({
    where: { id: entryId },
    data: { title, titleEn, description, descriptionEn, ...(date ? { date } : {}) },
  });

  revalidatePath("/admin/novedades");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteUpdateEntry(entryId: string, _formData: FormData) {
  await assertAdmin();
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
