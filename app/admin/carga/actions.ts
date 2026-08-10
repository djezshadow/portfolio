"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { put, del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

async function assertAdmin() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  const valid = token ? await verifySessionToken(token) : false;
  if (!valid) throw new Error("No autorizado");
}

export async function updateLoadingAnimation(formData: FormData) {
  await assertAdmin();

  const removeImage = formData.get("removeImage") === "on";
  const file = formData.get("file") as File | null;

  const current = await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

  let loadingAnimationUrl = current.loadingAnimationUrl;

  if (removeImage && loadingAnimationUrl) {
    try {
      await del(loadingAnimationUrl);
    } catch {
      // ignorar
    }
    loadingAnimationUrl = null;
  }

  if (file && file.size > 0) {
    if (current.loadingAnimationUrl) {
      try {
        await del(current.loadingAnimationUrl);
      } catch {
        // ignorar
      }
    }
    // Se sube TAL CUAL, sin pasar por sharp — un gif/webp animado
    // reprocesado pierde los frames de animación.
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.type === "image/gif" ? "gif" : "webp";
    const blob = await put(`settings/loading-${Date.now()}.${ext}`, buffer, {
      access: "public",
      contentType: file.type || "image/webp",
    });
    loadingAnimationUrl = blob.url;
  }

  await prisma.siteSettings.update({
    where: { id: "default" },
    data: {
      loadingAnimationUrl,
      loadingAnimationPosition: String(formData.get("loadingAnimationPosition") ?? "center"),
      loadingAnimationPositionMobile: String(formData.get("loadingAnimationPositionMobile") ?? "center"),
      loadingAnimationSize: Number(formData.get("loadingAnimationSize")) || 120,
      loadingAnimationSizeMobile: Number(formData.get("loadingAnimationSizeMobile")) || 90,
    },
  });

  revalidatePath("/admin/carga");
  revalidatePath("/", "layout");
}
