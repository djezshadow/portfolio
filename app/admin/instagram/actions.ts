"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

async function assertAdmin() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  const valid = token ? await verifySessionToken(token) : false;
  if (!valid) throw new Error("No autorizado");
}

// Acepta tanto instagram.com/p/... como instagram.com/reel/..., con o sin
// www, con o sin barra final o query string — y de paso valida que sea
// realmente un link de Instagram (evita cargar cualquier URL como si
// fuera un embed).
function normalizeInstagramUrl(raw: string): string {
  const trimmed = raw.trim();
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("Ese link no es una URL válida.");
  }
  if (!/(^|\.)instagram\.com$/.test(url.hostname.replace(/^www\./, "instagram.com"))) {
    throw new Error("Tiene que ser un link de instagram.com (un post o un reel).");
  }
  if (!/^\/(p|reel)\//.test(url.pathname)) {
    throw new Error("El link tiene que apuntar a un post (/p/...) o un reel (/reel/...).");
  }
  return `https://www.instagram.com${url.pathname}`;
}

export async function updateInstagramSettings(formData: FormData) {
  await assertAdmin();

  const enabled = formData.get("instagramFeedEnabled") === "on";
  const handle = (formData.get("instagramHandle") as string)?.trim().replace(/^@/, "") || null;
  const title = (formData.get("instagramFeedTitle") as string)?.trim() || null;
  const titleEn = (formData.get("instagramFeedTitleEn") as string)?.trim() || null;

  await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: { instagramFeedEnabled: enabled, instagramHandle: handle, instagramFeedTitle: title, instagramFeedTitleEn: titleEn },
    create: {
      id: "default",
      instagramFeedEnabled: enabled,
      instagramHandle: handle,
      instagramFeedTitle: title,
      instagramFeedTitleEn: titleEn,
    },
  });

  revalidatePath("/admin/instagram");
  revalidatePath("/", "layout");
}

export async function addInstagramPost(formData: FormData) {
  await assertAdmin();

  const rawUrl = String(formData.get("url") ?? "");
  if (!rawUrl.trim()) throw new Error("Falta el link del post.");
  const url = normalizeInstagramUrl(rawUrl);
  const caption = (formData.get("caption") as string)?.trim() || null;
  const section = formData.get("section") === "highlight" ? "highlight" : "feed";

  const count = await prisma.instagramPost.count({ where: { section } });
  await prisma.instagramPost.create({ data: { url, caption, section, order: count } });

  revalidatePath("/admin/instagram");
  revalidatePath("/", "layout");
}

export async function deleteInstagramPost(postId: string, _formData: FormData) {
  await assertAdmin();
  await prisma.instagramPost.delete({ where: { id: postId } });
  revalidatePath("/admin/instagram");
  revalidatePath("/", "layout");
}

export async function moveInstagramPost(postId: string, direction: "up" | "down") {
  await assertAdmin();

  const post = await prisma.instagramPost.findUnique({ where: { id: postId } });
  if (!post) return;

  const siblings = await prisma.instagramPost.findMany({
    where: { section: post.section },
    orderBy: { order: "asc" },
  });
  const idx = siblings.findIndex((p: { id: string }) => p.id === postId);
  const swapWith = direction === "up" ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= siblings.length) return;

  await prisma.$transaction([
    prisma.instagramPost.update({ where: { id: siblings[idx].id }, data: { order: siblings[swapWith].order } }),
    prisma.instagramPost.update({ where: { id: siblings[swapWith].id }, data: { order: siblings[idx].order } }),
  ]);

  revalidatePath("/admin/instagram");
  revalidatePath("/", "layout");
}
