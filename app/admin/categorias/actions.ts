"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function readStyleFields(formData: FormData) {
  return {
    accentColor: (formData.get("accentColor") as string) || null,
    fontFamily: (formData.get("fontFamily") as string) || null,
    bold: formData.get("bold") === "on",
    strikethrough: formData.get("strikethrough") === "on",
    alignment: (formData.get("alignment") as string) || "left",
    strokeWidth: formData.get("strokeWidth") ? Number(formData.get("strokeWidth")) : null,
  };
}

export async function createCategory(formData: FormData) {
  await assertAdmin();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Falta el nombre.");

  const themeMode = (formData.get("themeMode") as string) === "manual" ? "manual" : "auto";
  const themeName = themeMode === "manual" ? (formData.get("themeName") as string) : null;

  await prisma.category.create({
    data: {
      name,
      nameEn: (formData.get("nameEn") as string) || null,
      slug: slugify(name),
      order: Number(formData.get("order") ?? 0),
      themeMode,
      themeName: themeName as "noir" | "neon" | null,
      metaTitle: (formData.get("metaTitle") as string) || null,
      metaTitleEn: (formData.get("metaTitleEn") as string) || null,
      metaDescription: (formData.get("metaDescription") as string) || null,
      metaDescriptionEn: (formData.get("metaDescriptionEn") as string) || null,
      isComingSoon: formData.get("isComingSoon") === "on",
      showInNav: formData.get("showInNav") === "on",
      comingSoonHint: (formData.get("comingSoonHint") as string) || null,
      comingSoonHintEn: (formData.get("comingSoonHintEn") as string) || null,
      style: { create: readStyleFields(formData) },
    },
  });

  revalidatePath("/admin/categorias");
  revalidatePath("/", "layout");
  redirect("/admin/categorias");
}

export async function updateCategory(categoryId: string, formData: FormData) {
  await assertAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const themeMode = (formData.get("themeMode") as string) === "manual" ? "manual" : "auto";
  const themeName = themeMode === "manual" ? (formData.get("themeName") as string) : null;

  await prisma.category.update({
    where: { id: categoryId },
    data: {
      name,
      nameEn: (formData.get("nameEn") as string) || null,
      order: Number(formData.get("order") ?? 0),
      themeMode,
      themeName: themeName as "noir" | "neon" | null,
      metaTitle: (formData.get("metaTitle") as string) || null,
      metaTitleEn: (formData.get("metaTitleEn") as string) || null,
      metaDescription: (formData.get("metaDescription") as string) || null,
      metaDescriptionEn: (formData.get("metaDescriptionEn") as string) || null,
      isComingSoon: formData.get("isComingSoon") === "on",
      showInNav: formData.get("showInNav") === "on",
      comingSoonHint: (formData.get("comingSoonHint") as string) || null,
      comingSoonHintEn: (formData.get("comingSoonHintEn") as string) || null,
      style: {
        upsert: {
          create: readStyleFields(formData),
          update: readStyleFields(formData),
        },
      },
    },
  });

  revalidatePath("/admin/categorias");
  revalidatePath("/", "layout");
  redirect("/admin/categorias");
}

export async function deleteCategory(categoryId: string, _formData: FormData) {
  await assertAdmin();

  await prisma.category.delete({ where: { id: categoryId } });

  revalidatePath("/admin/categorias");
  revalidatePath("/", "layout");
  redirect("/admin/categorias");
}

export async function updateCategoryCover(categoryId: string, formData: FormData) {
  await assertAdmin();

  const removeImage = formData.get("removeImage") === "on";
  const image = formData.get("image") as File | null;

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) throw new Error("Categoría no encontrada.");

  let coverImageUrl = category.coverImageUrl;

  if (removeImage && coverImageUrl) {
    try {
      await del(coverImageUrl);
    } catch {
      // ignorar si ya no existe
    }
    coverImageUrl = null;
  }

  if (image && image.size > 0) {
    if (category.coverImageUrl) {
      try {
        await del(category.coverImageUrl);
      } catch {
        // ignorar si ya no existe
      }
    }
    const buffer = Buffer.from(await image.arrayBuffer());
    const webp = await sharp(buffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
    const blob = await put(`settings/category-cover-${categoryId}-${Date.now()}.webp`, webp, {
      access: "public",
      contentType: "image/webp",
    });
    coverImageUrl = blob.url;
  }

  await prisma.category.update({ where: { id: categoryId }, data: { coverImageUrl } });

  revalidatePath(`/admin/categorias/${categoryId}`);
  revalidatePath("/", "layout");
}
