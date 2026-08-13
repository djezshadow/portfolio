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

export async function saveNavOrder(orderedKeys: string[]) {
  await assertAdmin();

  await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: { navOrder: JSON.stringify(orderedKeys) },
    create: { id: "default", navOrder: JSON.stringify(orderedKeys) },
  });

  revalidatePath("/admin/navbar");
  revalidatePath("/", "layout");
}

export async function toggleCategoryNav(slug: string) {
  await assertAdmin();
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) return;
  await prisma.category.update({ where: { slug }, data: { showInNav: !category.showInNav } });
  revalidatePath("/admin/navbar");
  revalidatePath("/", "layout");
}

export async function toggleProjectNav(id: string) {
  await assertAdmin();
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return;
  await prisma.project.update({ where: { id }, data: { showInNav: !project.showInNav } });
  revalidatePath("/admin/navbar");
  revalidatePath("/", "layout");
}

export async function toggleAboutNav() {
  await assertAdmin();
  const settings = await prisma.siteSettings.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } });
  await prisma.siteSettings.update({ where: { id: "default" }, data: { aboutEnabled: !settings.aboutEnabled } });
  revalidatePath("/admin/navbar");
  revalidatePath("/", "layout");
}

export async function toggleCvNav() {
  await assertAdmin();
  const profile = await prisma.profile.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } });
  await prisma.profile.update({ where: { id: "default" }, data: { cvEnabled: !profile.cvEnabled } });
  revalidatePath("/admin/navbar");
  revalidatePath("/", "layout");
}

export async function toggleColaboradoresNav() {
  await assertAdmin();
  const settings = await prisma.siteSettings.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } });
  await prisma.siteSettings.update({ where: { id: "default" }, data: { colaboradoresInNav: !settings.colaboradoresInNav } });
  revalidatePath("/admin/navbar");
  revalidatePath("/", "layout");
}

export async function toggleContactoNav() {
  await assertAdmin();
  const settings = await prisma.siteSettings.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } });
  await prisma.siteSettings.update({ where: { id: "default" }, data: { contactoInNav: !settings.contactoInNav } });
  revalidatePath("/admin/navbar");
  revalidatePath("/", "layout");
}

export async function createCustomNavLink(formData: FormData) {
  await assertAdmin();
  const label = String(formData.get("label") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  if (!label || !url) throw new Error("Faltan el nombre o el link.");
  const labelEn = (formData.get("labelEn") as string)?.trim() || null;

  const count = await prisma.customNavLink.count();
  await prisma.customNavLink.create({ data: { label, labelEn, url, order: count } });

  revalidatePath("/admin/navbar");
  revalidatePath("/", "layout");
}

export async function deleteCustomNavLink(id: string) {
  await assertAdmin();
  await prisma.customNavLink.delete({ where: { id } });
  revalidatePath("/admin/navbar");
  revalidatePath("/", "layout");
}
