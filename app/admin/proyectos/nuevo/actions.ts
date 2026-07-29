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

export async function createProject(formData: FormData) {
  await assertAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const titleEn = (formData.get("titleEn") as string) || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const descriptionEn = (formData.get("descriptionEn") as string) || null;
  const role = String(formData.get("role") ?? "").trim() || null;
  const roleEn = (formData.get("roleEn") as string) || null;
  const categoryId = String(formData.get("categoryId") ?? "");
  const featured = formData.get("featured") === "on";
  const collaboratorId = (formData.get("collaboratorId") as string) || null;

  const isOngoing = formData.get("isOngoing") === "on";
  const dateStartRaw = formData.get("dateStart") as string | null; // "YYYY-MM"
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

  const watermarkEnabled = formData.get("watermarkEnabled") === "on";
  const watermarkOpacity = Number(formData.get("watermarkOpacity") ?? 40);
  const watermarkPosition = (formData.get("watermarkPosition") as WatermarkPosition) ?? "bottom-right";

  if (!title || !categoryId) {
    throw new Error("Falta título o categoría.");
  }

  const project = await prisma.project.create({
    data: {
      title,
      titleEn,
      description,
      descriptionEn,
      role,
      roleEn,
      featured,
      publishedAt,
      collaboratorId,
      dateStart,
      dateEnd,
      isOngoing,
      categories: { create: [{ categoryId }] },
    },
  });

  // Las fotos ya se subieron solas al storage desde el navegador (ver
  // components/admin/media-dropzone.tsx) — acá solo llegan sus URLs, así
  // que este pedido es liviano sin importar cuántas fotos o cuánto pesen.
  const uploadedUrls = formData.getAll("uploadedImageUrls") as string[];
  let order = 0;
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
      // Conversión a WebP (calidad 82, ver guía de export del spec).
      buffer = await sharp(buffer).webp({ quality: 82 }).toBuffer();

      const blob = await put(`media/${project.id}-${order}.webp`, buffer, {
        access: "public",
        contentType: "image/webp",
      });

      await prisma.media.create({
        data: {
          projectId: project.id,
          type: "image",
          url: blob.url,
          order,
          isThumbnail: order === 0,
        },
      });

      // Borramos el original temporal, ya no lo necesitamos.
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

  // Links de video (YouTube/Vimeo) — se guardan como Media tipo "video".
  const videoUrls = formData.getAll("videoUrls") as string[];
  for (const raw of videoUrls) {
    const parsed = parseVideoUrl(raw);
    if (!parsed) continue;
    await prisma.media.create({
      data: {
        projectId: project.id,
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
