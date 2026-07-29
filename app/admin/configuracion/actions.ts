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

export async function updateWatermarkSettings(formData: FormData) {
  await assertAdmin();

  const scale = Number(formData.get("watermarkScale") ?? 9);
  const opacity = Number(formData.get("watermarkOpacity") ?? 40);
  const position = (formData.get("watermarkPosition") as string) || "bottom-right";
  const removeLogo = formData.get("removeLogo") === "on";
  const logo = formData.get("logo") as File | null;

  try {
    const current = await prisma.siteSettings.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default" },
    });

    let watermarkUrl = current.watermarkUrl;

    if (removeLogo && watermarkUrl) {
      try {
        await del(watermarkUrl);
      } catch {
        // ignorar si ya no existe
      }
      watermarkUrl = null;
    }

    if (logo && logo.size > 0) {
      if (current.watermarkUrl) {
        try {
          await del(current.watermarkUrl);
        } catch {
          // ignorar si ya no existe
        }
      }
      // Se guarda como PNG (no WebP) para preservar transparencia sin sorpresas.
      const buffer = Buffer.from(await logo.arrayBuffer());
      const png = await sharp(buffer)
        .resize(1000, 1000, { fit: "inside", withoutEnlargement: true })
        .png()
        .toBuffer();
      const blob = await put(`settings/watermark-${Date.now()}.png`, png, {
        access: "public",
        contentType: "image/png",
      });
      watermarkUrl = blob.url;
    }

    await prisma.siteSettings.update({
      where: { id: "default" },
      data: { watermarkUrl, watermarkScale: scale, watermarkOpacity: opacity, watermarkPosition: position },
    });
  } catch (err) {
    console.error("Error en updateWatermarkSettings:", err);
    throw new Error(
      `No se pudo guardar la configuración. Revisá BLOB_READ_WRITE_TOKEN en Vercel. Detalle: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }

  revalidatePath("/admin/configuracion");
  revalidatePath("/", "layout");
}

export async function updateHeroSettings(formData: FormData) {
  await assertAdmin();

  const field = (name: string) => (formData.get(name) as string)?.trim() || null;
  const carouselPreset = (formData.get("carouselPreset") as string) || "cards";

  try {
    await prisma.siteSettings.upsert({
      where: { id: "default" },
      update: {
        heroTitle1: field("heroTitle1"),
        heroTitle1En: field("heroTitle1En"),
        heroTitle2: field("heroTitle2"),
        heroTitle2En: field("heroTitle2En"),
        heroSubtitle: field("heroSubtitle"),
        heroSubtitleEn: field("heroSubtitleEn"),
        carouselPreset,
      },
      create: {
        id: "default",
        heroTitle1: field("heroTitle1"),
        heroTitle1En: field("heroTitle1En"),
        heroTitle2: field("heroTitle2"),
        heroTitle2En: field("heroTitle2En"),
        heroSubtitle: field("heroSubtitle"),
        heroSubtitleEn: field("heroSubtitleEn"),
        carouselPreset,
      },
    });
  } catch (err) {
    console.error("Error en updateHeroSettings:", err);
    throw new Error(
      `No se pudo guardar el título/subtítulo. Detalle: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  revalidatePath("/admin/configuracion");
  revalidatePath("/", "layout");
}
