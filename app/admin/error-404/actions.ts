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

export async function updateNotFoundPage(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  await assertAdmin();

  const notFoundTitle = (formData.get("notFoundTitle") as string)?.trim() || null;
  const notFoundTitleEn = (formData.get("notFoundTitleEn") as string)?.trim() || null;
  const notFoundMessage = (formData.get("notFoundMessage") as string)?.trim() || null;
  const notFoundMessageEn = (formData.get("notFoundMessageEn") as string)?.trim() || null;
  const removeImage = formData.get("removeImage") === "on";
  const image = formData.get("image") as File | null;

  try {
    const current = await prisma.siteSettings.findUnique({ where: { id: "default" } });
    let notFoundImageUrl = current?.notFoundImageUrl ?? null;

    if (removeImage && notFoundImageUrl) {
      try {
        await del(notFoundImageUrl);
      } catch {
        // ignorar
      }
      notFoundImageUrl = null;
    }
    if (image && image.size > 0) {
      if (notFoundImageUrl) {
        try {
          await del(notFoundImageUrl);
        } catch {
          // ignorar
        }
      }
      const buffer = Buffer.from(await image.arrayBuffer());
      const webp = await sharp(buffer).resize({ width: 1000, withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
      const blob = await put(`settings/404-${Date.now()}.webp`, webp, { access: "public", contentType: "image/webp" });
      notFoundImageUrl = blob.url;
    }

    await prisma.siteSettings.upsert({
      where: { id: "default" },
      update: { notFoundTitle, notFoundTitleEn, notFoundMessage, notFoundMessageEn, notFoundImageUrl },
      create: {
        id: "default",
        notFoundTitle,
        notFoundTitleEn,
        notFoundMessage,
        notFoundMessageEn,
        notFoundImageUrl,
      },
    });
  } catch (err) {
    console.error("Error en updateNotFoundPage:", err);
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo guardar." };
  }

  revalidatePath("/admin/error-404");
  revalidatePath("/", "layout");
  return { ok: true };
}
