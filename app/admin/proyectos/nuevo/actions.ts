"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { finishProjectMedia, projectEditorialFields, readProjectMedia } from "@/lib/project-publication";
import { prisma } from "@/lib/prisma";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

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
  const showInNav = formData.get("showInNav") === "on";
  const isComingSoon = formData.get("isComingSoon") === "on";
  const comingSoonHint = (formData.get("comingSoonHint") as string)?.trim() || null;
  const comingSoonHintEn = (formData.get("comingSoonHintEn") as string)?.trim() || null;
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

  if (!title || !categoryId) throw new Error("Falta título o categoría.");
  if (publishState === "scheduled" && (!publishedAt || Number.isNaN(publishedAt.getTime()))) {
    throw new Error("Elegí una fecha válida para publicar.");
  }
  const media = readProjectMedia(formData);

  const project = await prisma.project.create({
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
      collaboratorId,
      dateStart,
      dateEnd,
      isOngoing,
      categories: { create: [{ categoryId }] },
      media: { create: media.map((item, order) => ({ ...item, order, isThumbnail: order === 0 })) },
    },
  });

  finishProjectMedia(project.id, media.filter((item) => item.type === "image").map((item) => item.url));

  revalidatePath("/admin");
  revalidatePath("/", "layout");
  redirect(`/admin/proyectos/${project.id}`);
}
