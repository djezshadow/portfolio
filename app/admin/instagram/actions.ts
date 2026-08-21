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
// fuera un embed). Devuelve el link normalizado o null si es inválido
// (en vez de tirar throw — ver por qué en addInstagramPost).
function normalizeInstagramUrl(raw: string): { url: string } | { error: string } {
  const trimmed = raw.trim();
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { error: "Ese link no es una URL válida." };
  }
  if (!/(^|\.)instagram\.com$/.test(url.hostname.replace(/^www\./, "instagram.com"))) {
    return { error: "Tiene que ser un link de instagram.com (un post o un reel)." };
  }
  if (!/^\/(p|reel)\//.test(url.pathname)) {
    return { error: "El link tiene que apuntar a un post (/p/...) o un reel (/reel/...)." };
  }
  return { url: `https://www.instagram.com${url.pathname}` };
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

export async function addInstagramPost(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  await assertAdmin();

  const rawUrl = String(formData.get("url") ?? "");
  if (!rawUrl.trim()) return { ok: false, error: "Falta el link del post." };
  const normalized = normalizeInstagramUrl(rawUrl);
  if ("error" in normalized) return { ok: false, error: normalized.error };
  const url = normalized.url;
  const caption = (formData.get("caption") as string)?.trim() || null;
  const section = formData.get("section") === "highlight" ? "highlight" : "feed";

  // No usamos throw acá: en producción, Next.js siempre reemplaza el
  // mensaje de cualquier error lanzado desde una Server Action por un
  // texto genérico ("An error occurred...") antes de que llegue al
  // cliente — es una medida de seguridad para no filtrar detalles
  // internos por accidente, pero de paso nos tapaba el mensaje real acá.
  // Devolviendo el error como dato normal (no como excepción), Next lo
  // deja pasar tal cual lo escribimos.
  try {
    const count = await prisma.instagramPost.count({ where: { section } });
    await prisma.instagramPost.create({ data: { url, caption, section, order: count } });
  } catch (err) {
    console.error("Error en addInstagramPost:", err);
    // P2021 = "la tabla no existe" — el caso más probable si acabás de
    // agregar este modelo al schema y todavía no corriste
    // `npx prisma db push` contra la base de datos real.
    const code = (err as { code?: string } | null)?.code;
    if (code === "P2021") {
      return {
        ok: false,
        error:
          "Falta sincronizar la base de datos: corré 'npx prisma db push' (con tu DATABASE_URL de producción) y volvé a intentar.",
      };
    }
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo guardar el post." };
  }

  revalidatePath("/admin/instagram");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteInstagramPost(postId: string, _formData: FormData) {
  await assertAdmin();
  try {
    await prisma.instagramPost.delete({ where: { id: postId } });
  } catch (err) {
    console.error("Error en deleteInstagramPost:", err);
    return; // no hay feedback visual en el botón de borrar — no rompemos la página
  }
  revalidatePath("/admin/instagram");
  revalidatePath("/", "layout");
}

export async function moveInstagramPost(postId: string, direction: "up" | "down") {
  await assertAdmin();

  try {
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
  } catch (err) {
    console.error("Error en moveInstagramPost:", err);
    return;
  }

  revalidatePath("/admin/instagram");
  revalidatePath("/", "layout");
}
