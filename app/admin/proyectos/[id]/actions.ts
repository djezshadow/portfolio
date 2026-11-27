"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { put, del } from "@vercel/blob";
import { finishProjectMedia, projectEditorialFields, readProjectMedia } from "@/lib/project-publication";
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

export async function updateProject(projectId: string, formData: FormData) {
  await assertAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const titleEn = (formData.get("titleEn") as string) || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const descriptionEn = (formData.get("descriptionEn") as string) || null;
  const role = String(formData.get("role") ?? "").trim() || null;
  const roleEn = (formData.get("roleEn") as string) || null;
  const categoryId = String(formData.get("categoryId") ?? "");
  const featured = formData.get("featured") === "on";
  const showInNav = formData.get("showInNav") === "on";
  const isComingSoon = formData.get("isComingSoon") === "on";
  const comingSoonHint = (formData.get("comingSoonHint") as string)?.trim() || null;
  const comingSoonHintEn = (formData.get("comingSoonHintEn") as string)?.trim() || null;
  const collaboratorId = (formData.get("collaboratorId") as string) || null;

  const isOngoing = formData.get("isOngoing") === "on";
  const dateStartRaw = formData.get("dateStart") as string | null;
  const dateEndRaw = formData.get("dateEnd") as string | null;
  const dateStart = dateStartRaw ? new Date(`${dateStartRaw}-01`) : null;
  const dateEnd = !isOngoing && dateEndRaw ? new Date(`${dateEndRaw}-01`) : null;

  const publishState = String(formData.get("publishState") ?? "draft");
  const scheduledFor = formData.get("scheduledFor") as string | null;
  const publishedAt =
    publishState === "now"
      ? new Date()
      : publishState === "scheduled" && scheduledFor
      ? new Date(scheduledFor)
      : null;

  if (!title || !categoryId) {
    throw new Error("Falta título o categoría.");
  }

  if (publishState === "scheduled" && (!publishedAt || Number.isNaN(publishedAt.getTime()))) {
    throw new Error("Elegí una fecha válida para publicar.");
  }
  const media = readProjectMedia(formData);
  const markedForDeletion = new Set(formData.getAll("deleteMedia").map(String));
  const batchSelection = new Set(formData.getAll("batchMedia").map(String));
  const batchGroup = formData.get("batchGroup");
  const batchWatermark = formData.get("batchWatermark");
  const thumbnailId = String(formData.get("thumbnailMediaId") ?? "");

  const { removed, newPhotos, rebake } = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Project" WHERE id = ${projectId} FOR UPDATE`;
    const current = await tx.project.findUniqueOrThrow({
      where: { id: projectId },
      select: { categories: { select: { categoryId: true } }, mediaGroups: { select: { id: true } } },
    });
    const oldCategory = String(formData.get("originalCategoryId") ?? "");
    const categoryIds = [...new Set([categoryId, ...current.categories.map((row) => row.categoryId).filter((id) => id !== oldCategory)])];
    const groups = new Set(current.mediaGroups.map(({ id }) => id));
    const existing = await tx.media.findMany({ where: { projectId }, orderBy: [{ order: "asc" }, { id: "asc" }] });
    const removed = existing.filter((item) => markedForDeletion.has(item.id));
    const retained = existing.filter((item) => !markedForDeletion.has(item.id));
    const validThumbnail = retained.some(({ id }) => id === thumbnailId) ? thumbnailId
      : retained.find((item) => item.isThumbnail)?.id ?? retained[0]?.id;
    const retainedUrls = new Set(retained.filter((item) => item.type === "image").map((item) => item.url));
    const additional = media.filter((item) => item.type !== "image" || !retainedUrls.has(item.url));
    const rebake: string[] = [];
    if (removed.length) await tx.media.deleteMany({ where: { id: { in: removed.map(({ id }) => id) }, projectId } });
    for (const item of retained) {
      const selected = batchSelection.has(item.id);
      const groupInput = selected && batchGroup !== null && batchGroup !== "keep" ? batchGroup : formData.get(`mediaGroup:${item.id}`);
      const groupId = groupInput === null ? item.groupId : String(groupInput) || null;
      if (groupId && !groups.has(groupId)) throw new Error("La subcategoría elegida ya no está disponible.");
      const watermarkEnabled = selected && item.type === "image" && (batchWatermark === "on" || batchWatermark === "off")
        ? batchWatermark === "on" : item.watermarkEnabled;
      const isThumbnail = item.id === validThumbnail;
      if (groupId === item.groupId && watermarkEnabled === item.watermarkEnabled && isThumbnail === item.isThumbnail) continue;
      const watermarkChanged = watermarkEnabled !== item.watermarkEnabled;
      if (watermarkChanged) rebake.push(item.url);
      await tx.media.update({ where: { id: item.id }, data: {
        groupId, watermarkEnabled, isThumbnail, ...(watermarkChanged ? { bakedThumbUrl: null, bakedFullUrl: null } : {}),
      } });
    }
    const order = Math.max(-1, ...retained.map((item) => item.order)) + 1;
    await tx.project.update({
      where: { id: projectId },
      data: {
      title,
      titleEn,
      description,
      descriptionEn,
      role,
      roleEn,
      featured,
      ...projectEditorialFields(formData),
      showInNav,
      isComingSoon,
      comingSoonHint,
      comingSoonHintEn,
      publishedAt,
      dateStart,
      dateEnd,
      isOngoing,
      collaborator: collaboratorId ? { connect: { id: collaboratorId } } : { disconnect: true },
        categories: { deleteMany: {}, create: categoryIds.map((categoryId) => ({ categoryId })) },
        media: { create: additional.map((item, index) => ({ ...item, order: order + index, isThumbnail: !validThumbnail && index === 0 })) },
      },
    });
    return {
      removed: [...removed.flatMap((item) => [item.url, item.bakedFullUrl, item.bakedThumbUrl]),
        ...retained.filter((item) => rebake.includes(item.url)).flatMap((item) => [item.bakedThumbUrl, item.bakedFullUrl])],
      newPhotos: additional.filter((item) => item.type === "image").map((item) => item.url),
      rebake,
    };
  }, { timeout: 15000 });
  finishProjectMedia(projectId, [...newPhotos, ...rebake], removed.filter((url): url is string => Boolean(url)));

  revalidatePath("/admin");
  revalidatePath("/", "layout");
  redirect(`/admin/proyectos/${projectId}`);
}

export async function createMediaGroup(projectId: string, formData: FormData) {
  await assertAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const nameEn = (formData.get("nameEn") as string)?.trim() || null;
  if (!name) throw new Error("Falta el nombre de la subcategoría.");

  const count = await prisma.mediaGroup.count({ where: { projectId } });
  await prisma.mediaGroup.create({
    data: { projectId, name, nameEn, order: count },
  });

  revalidatePath(`/admin/proyectos/${projectId}`);
}

export async function renameMediaGroup(groupId: string, formData: FormData) {
  await assertAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const nameEn = (formData.get("nameEn") as string)?.trim() || null;
  if (!name) throw new Error("Falta el nombre de la subcategoría.");

  const group = await prisma.mediaGroup.update({
    where: { id: groupId },
    data: { name, nameEn },
  });

  revalidatePath(`/admin/proyectos/${group.projectId}`);
}

export async function deleteMediaGroup(groupId: string, _formData: FormData) {
  await assertAdmin();

  // La media que estaba en este grupo no se borra: onDelete: SetNull la
  // deja sin subcategoría (queda en "Sin subcategoría").
  const group = await prisma.mediaGroup.delete({ where: { id: groupId } });
  if (group.coverImageUrl) {
    try {
      await del(group.coverImageUrl);
    } catch {
      // ignorar si ya no existe
    }
  }

  revalidatePath(`/admin/proyectos/${group.projectId}`);
}

export async function moveMediaGroupOrder(groupId: string, direction: "up" | "down") {
  await assertAdmin();

  const group = await prisma.mediaGroup.findUnique({ where: { id: groupId } });
  if (!group) return;

  const all = await prisma.mediaGroup.findMany({
    where: { projectId: group.projectId },
    orderBy: { order: "asc" },
    select: { id: true, order: true },
  });
  const index = all.findIndex((g) => g.id === groupId);
  if (index === -1) return;

  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= all.length) return;

  const current = all[index];
  const neighbor = all[swapWith];

  await prisma.$transaction([
    prisma.mediaGroup.update({ where: { id: current.id }, data: { order: neighbor.order } }),
    prisma.mediaGroup.update({ where: { id: neighbor.id }, data: { order: current.order } }),
  ]);

  revalidatePath(`/admin/proyectos/${group.projectId}`);
}

export async function updateMediaGroupCover(groupId: string, formData: FormData) {
  await assertAdmin();

  const removeImage = formData.get("removeImage") === "on";
  const image = formData.get("image") as File | null;

  const group = await prisma.mediaGroup.findUnique({ where: { id: groupId } });
  if (!group) throw new Error("Subcategoría no encontrada.");

  let coverImageUrl = group.coverImageUrl;

  if (removeImage && coverImageUrl) {
    try {
      await del(coverImageUrl);
    } catch {
      // ignorar
    }
    coverImageUrl = null;
  }

  if (image && image.size > 0) {
    if (group.coverImageUrl) {
      try {
        await del(group.coverImageUrl);
      } catch {
        // ignorar
      }
    }
    const buffer = Buffer.from(await image.arrayBuffer());
    // 1600x900 (16:9) — mismo formato que las portadas de proyecto/categoría,
    // así se ve prolijo tanto en la grilla de subcategorías como en el
    // carrusel si algún día se usa ahí también.
    const webp = await sharp(buffer)
      .resize(1600, 900, { fit: "cover" })
      .webp({ quality: 85 })
      .toBuffer();
    const blob = await put(`media/group-cover-${groupId}-${Date.now()}.webp`, webp, {
      access: "public",
      contentType: "image/webp",
    });
    coverImageUrl = blob.url;
  }

  await prisma.mediaGroup.update({ where: { id: groupId }, data: { coverImageUrl } });

  revalidatePath(`/admin/proyectos/${group.projectId}`);
  revalidatePath("/", "layout");
}

export async function moveMediaGroupToProject(groupId: string, formData: FormData) {
  await assertAdmin();

  const targetProjectId = String(formData.get("targetProjectId") ?? "");
  if (!targetProjectId) throw new Error("Elegí a qué proyecto mover la subcategoría.");

  const group = await prisma.mediaGroup.findUnique({ where: { id: groupId } });
  if (!group) throw new Error("Subcategoría no encontrada.");
  if (group.projectId === targetProjectId) return;

  // Mueve la subcategoría Y toda su media al proyecto destino — si solo
  // moviéramos el grupo, las fotos quedarían "huérfanas" (con groupId
  // apuntando a un grupo de OTRO proyecto), así que van juntos siempre.
  await prisma.$transaction([
    prisma.mediaGroup.update({ where: { id: groupId }, data: { projectId: targetProjectId } }),
    prisma.media.updateMany({ where: { groupId }, data: { projectId: targetProjectId } }),
  ]);

  revalidatePath(`/admin/proyectos/${group.projectId}`);
  revalidatePath(`/admin/proyectos/${targetProjectId}`);
  revalidatePath("/", "layout");
  redirect(`/admin/proyectos/${targetProjectId}`);
}

export async function updateMediaWatermarkOverride(mediaId: string, formData: FormData) {
  await assertAdmin();

  const useCustom = formData.get("useCustom") === "on";
  const position = String(formData.get("position") ?? "");
  const opacityRaw = formData.get("opacity");

  const media = await prisma.media.update({
    where: { id: mediaId },
    data: {
      watermarkPositionOverride: useCustom && position ? position : null,
      watermarkOpacityOverride: useCustom && opacityRaw ? Number(opacityRaw) : null,
    },
  });

  const settings = await getSiteSettings();
  try {
    await bakeMediaWatermark(media, settings);
  } catch (err) {
    console.error(`No se pudo rehornear ${mediaId} tras cambiar el override:`, err);
  }

  revalidatePath(`/admin/proyectos/${media.projectId}`);
  revalidatePath("/", "layout");
}

export async function updateMediaExif(mediaId: string, formData: FormData) {
  await assertAdmin();

  const field = (name: string) => (formData.get(name) as string)?.trim() || null;

  const media = await prisma.media.update({
    where: { id: mediaId },
    data: {
      exifCamera: field("exifCamera"),
      exifAperture: field("exifAperture"),
      exifShutterSpeed: field("exifShutterSpeed"),
      exifIso: field("exifIso"),
      exifFps: field("exifFps"),
    },
  });

  revalidatePath(`/admin/proyectos/${media.projectId}`);
  revalidatePath("/", "layout");
}

export async function updateMediaAlt(mediaId: string, formData: FormData) {
  await assertAdmin();

  const field = (name: string) => (formData.get(name) as string)?.trim() || null;

  const media = await prisma.media.update({
    where: { id: mediaId },
    data: { altText: field("altText"), altTextEn: field("altTextEn") },
  });

  revalidatePath(`/admin/proyectos/${media.projectId}`);
  revalidatePath("/", "layout");
}

/**
 * Reordena TODAS las fotos de un proyecto/subcategoría de una — pedido:
 * "poder mover de lugar las fotos... con drag and drop". A diferencia de
 * moveMediaOrder (que solo intercambia con el vecino), esta recibe la
 * lista completa de IDs ya en el orden final que arma el arrastre en el
 * navegador, y actualiza el campo `order` de todas de un saque.
 */
export async function reorderMedia(orderedIds: string[]) {
  await assertAdmin();
  if (orderedIds.length === 0) return;

  const first = await prisma.media.findUnique({ where: { id: orderedIds[0] }, select: { projectId: true } });
  if (!first) return;

  await prisma.$transaction(orderedIds.map((id, index) => prisma.media.update({ where: { id }, data: { order: index } })));

  revalidatePath(`/admin/proyectos/${first.projectId}`);
  revalidatePath("/", "layout");
}

export async function moveMediaOrder(mediaId: string, direction: "up" | "down") {
  await assertAdmin();

  const media = await prisma.media.findUnique({ where: { id: mediaId } });
  if (!media) return;

  const all = await prisma.media.findMany({
    where: { projectId: media.projectId },
    orderBy: { order: "asc" },
    select: { id: true, order: true },
  });
  const index = all.findIndex((m) => m.id === mediaId);
  if (index === -1) return;

  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= all.length) return;

  const current = all[index];
  const neighbor = all[swapWith];

  await prisma.$transaction([
    prisma.media.update({ where: { id: current.id }, data: { order: neighbor.order } }),
    prisma.media.update({ where: { id: neighbor.id }, data: { order: current.order } }),
  ]);

  revalidatePath(`/admin/proyectos/${media.projectId}`);
  revalidatePath("/", "layout");
}

export async function deleteProject(projectId: string, _formData: FormData) {
  await assertAdmin();

  const media = await prisma.media.findMany({ where: { projectId } });
  for (const m of media) {
    if (m.url) {
      try {
        await del(m.url);
      } catch {
        // ignorar si ya no existe
      }
    }
  }

  await prisma.project.delete({ where: { id: projectId } });

  revalidatePath("/admin");
  revalidatePath("/", "layout");
  redirect("/admin");
}

export async function duplicateProject(projectId: string) {
  await assertAdmin();
  const source = await prisma.project.findUniqueOrThrow({
    where: { id: projectId }, include: { categories: true, tags: true, mediaGroups: true },
  });
  const draft = await prisma.project.create({
    data: {
      title: `${source.title} (copia)`, titleEn: source.titleEn ? `${source.titleEn} (copy)` : null,
      description: source.description, descriptionEn: source.descriptionEn,
      role: source.role, roleEn: source.roleEn,
      behindScenes: source.behindScenes, behindScenesEn: source.behindScenesEn,
      dateStart: source.dateStart, dateEnd: source.dateEnd, isOngoing: source.isOngoing,
      collaboratorId: source.collaboratorId,
      categories: { create: source.categories.map(({ categoryId }) => ({ categoryId })) },
      tags: { create: source.tags.map(({ tagId }) => ({ tagId })) },
      mediaGroups: { create: source.mediaGroups.map(({ name, nameEn, order }) => ({ name, nameEn, order })) },
    },
  });
  revalidatePath("/admin");
  redirect(`/admin/proyectos/${draft.id}`);
}
