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
  const validAligns = ["left", "center", "right"];
  const rawAlign = (formData.get("homeAlign") as string) || "left";
  const homeAlign = validAligns.includes(rawAlign) ? rawAlign : "left";

  const validSizes = ["sm", "md", "lg"];
  const rawItemSize = (formData.get("carouselItemSize") as string) || "md";
  const carouselItemSize = validSizes.includes(rawItemSize) ? rawItemSize : "md";
  const carouselGap = Math.min(64, Math.max(0, Number(formData.get("carouselGap") ?? 16) || 16));
  const validBackgrounds = ["transparent", "surface"];
  const rawBackground = (formData.get("carouselBackground") as string) || "transparent";
  const carouselBackground = validBackgrounds.includes(rawBackground) ? rawBackground : "transparent";
  const carouselShadow = formData.get("carouselShadow") === "on";
  const carouselGlass = formData.get("carouselGlass") === "on";
  const rawCarouselAlign = (formData.get("carouselAlign") as string) || "left";
  const carouselAlign = validAligns.includes(rawCarouselAlign) ? rawCarouselAlign : "left";

  const sharedFields = {
    heroTitle1: field("heroTitle1"),
    heroTitle1En: field("heroTitle1En"),
    heroTitle2: field("heroTitle2"),
    heroTitle2En: field("heroTitle2En"),
    heroSubtitle: field("heroSubtitle"),
    heroSubtitleEn: field("heroSubtitleEn"),
    heroKicker: field("heroKicker"),
    heroKickerEn: field("heroKickerEn"),
    heroKickerShowTimecode: formData.get("heroKickerShowTimecode") === "on",
    carouselPreset,
    homeAlign,
    carouselItemSize,
    carouselGap,
    carouselBackground,
    carouselShadow,
    carouselGlass,
    carouselAlign,
  };

  try {
    await prisma.siteSettings.upsert({
      where: { id: "default" },
      update: sharedFields,
      create: { id: "default", ...sharedFields },
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

export async function updateLogoSettings(formData: FormData) {
  await assertAdmin();

  const noirLogo = formData.get("logoNoir") as File | null;
  const neonLogo = formData.get("logoNeon") as File | null;
  const removeNoirLogo = formData.get("removeNoirLogo") === "on";
  const removeNeonLogo = formData.get("removeNeonLogo") === "on";

  try {
    const current = await prisma.siteSettings.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default" },
    });

    let logoNoirUrl = current.logoNoirUrl;
    let logoNeonUrl = current.logoNeonUrl;

    if (removeNoirLogo && logoNoirUrl) {
      try {
        await del(logoNoirUrl);
      } catch {
        // ignorar
      }
      logoNoirUrl = null;
    }
    if (removeNeonLogo && logoNeonUrl) {
      try {
        await del(logoNeonUrl);
      } catch {
        // ignorar
      }
      logoNeonUrl = null;
    }

    if (noirLogo && noirLogo.size > 0) {
      if (current.logoNoirUrl) {
        try {
          await del(current.logoNoirUrl);
        } catch {
          // ignorar
        }
      }
      const buffer = Buffer.from(await noirLogo.arrayBuffer());
      const png = await sharp(buffer).resize(400, 120, { fit: "inside" }).png().toBuffer();
      const blob = await put(`settings/logo-noir-${Date.now()}.png`, png, {
        access: "public",
        contentType: "image/png",
      });
      logoNoirUrl = blob.url;
    }

    if (neonLogo && neonLogo.size > 0) {
      if (current.logoNeonUrl) {
        try {
          await del(current.logoNeonUrl);
        } catch {
          // ignorar
        }
      }
      const buffer = Buffer.from(await neonLogo.arrayBuffer());
      const png = await sharp(buffer).resize(400, 120, { fit: "inside" }).png().toBuffer();
      const blob = await put(`settings/logo-neon-${Date.now()}.png`, png, {
        access: "public",
        contentType: "image/png",
      });
      logoNeonUrl = blob.url;
    }

    await prisma.siteSettings.update({
      where: { id: "default" },
      data: {
        logoNoirUrl,
        logoNeonUrl,
        logoFloating: formData.get("logoFloating") === "true",
        logoSize: Number(formData.get("logoSize")) || 64,
        logoSizeMobile: Number(formData.get("logoSizeMobile")) || 40,
      },
    });
  } catch (err) {
    console.error("Error en updateLogoSettings:", err);
    throw new Error(
      `No se pudo guardar el logo. Detalle: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  revalidatePath("/admin/configuracion");
  revalidatePath("/", "layout");
}

export async function updateContactSettings(formData: FormData) {
  await assertAdmin();

  const contactEmail = (formData.get("contactEmail") as string)?.trim() || null;

  try {
    await prisma.siteSettings.upsert({
      where: { id: "default" },
      update: { contactEmail },
      create: { id: "default", contactEmail },
    });
  } catch (err) {
    console.error("Error en updateContactSettings:", err);
    throw new Error(
      `No se pudo guardar el mail de contacto. Detalle: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  revalidatePath("/admin/configuracion");
}

export async function updateFooterSocials(formData: FormData) {
  await assertAdmin();

  const field = (name: string) => (formData.get(name) as string)?.trim() || null;

  await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {
      footerInstagramUrl: field("footerInstagramUrl"),
      footerTiktokUrl: field("footerTiktokUrl"),
      footerLinkedinUrl: field("footerLinkedinUrl"),
      footerYoutubeUrl: field("footerYoutubeUrl"),
    },
    create: {
      id: "default",
      footerInstagramUrl: field("footerInstagramUrl"),
      footerTiktokUrl: field("footerTiktokUrl"),
      footerLinkedinUrl: field("footerLinkedinUrl"),
      footerYoutubeUrl: field("footerYoutubeUrl"),
    },
  });

  revalidatePath("/admin/configuracion");
  revalidatePath("/", "layout");
}
