"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { put, del } from "@vercel/blob";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { applyWatermark, type WatermarkPosition } from "@/lib/watermark";
import { getSiteSettings } from "@/lib/site-settings";
import { parseVideoUrl } from "@/lib/video-url";

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
      publishedAt,
      categories: {
        deleteMany: {},
        create: [{ categoryId }],
      },
    },
  });

  // Nueva media agregada en esta edición (misma lógica que al crear)
  const watermarkEnabled = formData.get("watermarkEnabled") === "on";
  const watermarkOpacity = Number(formData.get("watermarkOpacity") ?? 40);
  const watermarkPosition = (formData.get("watermarkPosition") as WatermarkPosition) ?? "bottom-right";

  const existingCount = await prisma.media.count({ where: { projectId } });
  const uploadedUrls = formData.getAll("uploadedImageUrls") as string[];
  let order = existingCount;
  let siteSettings = null;
  if (watermarkEnabled) {
    try {
      siteSettings = await getSiteSettings();
    } catch (err) {
      console.error("No se pudo leer SiteSettings (¿corriste prisma db push?):", err);
    }
  }

  for (const tempUrl of uploadedUrls) {
    if (!tempUrl) continue;

    try {
      const res = await fetch(tempUrl);
      let buffer: Buffer = Buffer.from(await res.arrayBuffer());

      if (watermarkEnabled) {
        buffer = await applyWatermark(buffer, {
          opacity: watermarkOpacity,
          position: watermarkPosition,
          customLogoUrl: siteSettings?.watermarkUrl,
          scale: siteSettings?.watermarkScale,
        });
      }
      buffer = await sharp(buffer).webp({ quality: 82 }).toBuffer();

      const blob = await put(`media/${projectId}-${order}.webp`, buffer, {
        access: "public",
        contentType: "image/webp",
      });

      await prisma.media.create({
        data: { projectId, type: "image", url: blob.url, order, isThumbnail: order === 0 },
      });

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
