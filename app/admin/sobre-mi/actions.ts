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

export async function updateAboutSettings(formData: FormData) {
  await assertAdmin();

  const field = (name: string) => (formData.get(name) as string)?.trim() || null;
  const aboutEnabled = formData.get("aboutEnabled") === "on";
  const removeImage = formData.get("removeImage") === "on";
  const image = formData.get("image") as File | null;

  try {
    const current = await prisma.siteSettings.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default" },
    });

    let aboutImageUrl = current.aboutImageUrl;

    if (removeImage && aboutImageUrl) {
      try {
        await del(aboutImageUrl);
      } catch {
        // ignorar si ya no existe
      }
      aboutImageUrl = null;
    }

    if (image && image.size > 0) {
      if (current.aboutImageUrl) {
        try {
          await del(current.aboutImageUrl);
        } catch {
          // ignorar si ya no existe
        }
      }
      const buffer = Buffer.from(await image.arrayBuffer());
      const webp = await sharp(buffer)
        .resize({ width: 1600, withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();
      const blob = await put(`settings/about-${Date.now()}.webp`, webp, {
        access: "public",
        contentType: "image/webp",
      });
      aboutImageUrl = blob.url;
    }

    await prisma.siteSettings.update({
      where: { id: "default" },
      data: {
        aboutEnabled,
        aboutTitle: field("aboutTitle"),
        aboutTitleEn: field("aboutTitleEn"),
        aboutContent: field("aboutContent"),
        aboutContentEn: field("aboutContentEn"),
        aboutCustomCss: field("aboutCustomCss"),
        aboutImageUrl,
      },
    });
  } catch (err) {
    console.error("Error en updateAboutSettings:", err);
    throw new Error(
      `No se pudo guardar "Sobre mí". Detalle: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  revalidatePath("/admin/sobre-mi");
  revalidatePath("/", "layout");
}
