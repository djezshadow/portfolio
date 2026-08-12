"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { put, del } from "@vercel/blob";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { parseVideoUrl } from "@/lib/video-url";
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

  // Borrar media marcada para eliminar (checkboxes "deleteMedia")
  const mediaIdsToDelete = formData.getAll("deleteMedia").map(String);
  if (mediaIdsToDelete.length > 0) {
    const toDelete = await prisma.media.findMany({ where: { id: { in: mediaIdsToDelete } } });
    for (const m of toDelete) {
      if (m.url) {
        try {
          await del(m.url);
        } catch {
          // si ya no existe en el blob, seguimos igual
        }
      }
    }
    await prisma.media.deleteMany({ where: { id: { in: mediaIdsToDelete } } });
  }

  // Reasignación de subcategoría por foto/video existente — cada select
  // en el form se llama "mediaGroup:<mediaId>" (item #13).
  const existingMedia = await prisma.media.findMany({ where: { projectId }, select: { id: true } });
  for (const m of existingMedia) {
    if (mediaIdsToDelete.includes(m.id)) continue;
    const raw = formData.get(`mediaGroup:${m.id}`);
    if (raw === null) continue;
    const groupId = String(raw) || null;
    await prisma.media.update({ where: { id: m.id }, data: { groupId } });
  }

  // Portada del proyecto (item #17) — un solo radio "thumbnailMediaId" en
  // el form elige qué foto se usa como portada en las cards del sitio.
  const thumbnailMediaId = formData.get("thumbnailMediaId");
  if (thumbnailMediaId) {
    await prisma.media.updateMany({ where: { projectId }, data: { isThumbnail: false } });
    await prisma.media.update({
      where: { id: String(thumbnailMediaId) },
      data: { isThumbnail: true },
    });
  }

  await prisma.project.update({
    where: { id: projectId },
    data: {
      title,
      titleEn,
      description,
      descriptionEn,
      role,
      roleEn,
      featured,
      showInNav,
      isComingSoon,
      comingSoonHint,
      comingSoonHintEn,
      publishedAt,
      dateStart,
      dateEnd,
      isOngoing,
      collaborator: collaboratorId ? { connect: { id: collaboratorId } } : { disconnect: true },
      categories: {
        deleteMany: {},
        create: [{ categoryId }],
      },
    },
  });

  // Nueva media agregada en esta edición: se sube el original y se hornea
  // la versión pública (con watermark si corresponde) al toque — no
  // depende de apretar "Aplicar" en Configuración después.
  const watermarkEnabled = formData.get("watermarkEnabled") === "on";

  const existingCount = await prisma.media.count({ where: { projectId } });
  const uploadedUrls = formData.getAll("uploadedImageUrls") as string[];
  let order = existingCount;
  const watermarkSettings = await getSiteSettings();

  for (const tempUrl of uploadedUrls) {
    if (!tempUrl) continue;

    try {
      const res = await fetch(tempUrl);
      const buffer = Buffer.from(await res.arrayBuffer());
      const webp = await sharp(buffer)
        .resize({ width: 2400, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();

      const blob = await put(`media/${projectId}-${order}.webp`, webp, {
        access: "public",
        contentType: "image/webp",
      });

      const created = await prisma.media.create({
        data: { projectId, type: "image", url: blob.url, watermarkEnabled, order, isThumbnail: order === 0 },
      });

      try {
        await bakeMediaWatermark(created, watermarkSettings);
      } catch (err) {
        console.error(`No se pudo hornear el watermark de ${created.id} al subir:`, err);
      }

      try {
        await del(tempUrl);
      } catch {
        // no pasa nada si ya no existe
      }

      order++;
    } catch (err) {
      console.error("Error procesando una foto subida:", err);
      throw new Error(
        `No se pudo procesar una de las fotos. Detalle: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }

  // Links de video nuevos (YouTube/Vimeo)
  const videoUrls = formData.getAll("videoUrls") as string[];
  for (const raw of videoUrls) {
    const parsed = parseVideoUrl(raw);
    if (!parsed) continue;
    await prisma.media.create({
      data: {
        projectId,
        type: "video",
        url: "",
        videoProvider: parsed.provider,
        videoId: parsed.videoId,
        order,
      },
    });
    order++;
  }

  revalidatePath("/admin");
  revalidatePath("/", "layout");
  redirect("/admin");
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
