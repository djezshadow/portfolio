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

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createCollaboratorType(formData: FormData) {
  await assertAdmin();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Falta el nombre del tipo.");
  const nameEn = (formData.get("nameEn") as string)?.trim() || null;
  const isClient = formData.get("isClient") === "on";

  let slug = slugify(name);
  if (!slug) throw new Error("Nombre inválido.");
  const existing = await prisma.collaboratorTypeOption.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;

  const count = await prisma.collaboratorTypeOption.count();
  await prisma.collaboratorTypeOption.create({
    data: { slug, name, nameEn, isClient, order: count },
  });

  revalidatePath("/admin/tipos-colaborador");
  revalidatePath("/admin/colaboradores");
}

export async function renameCollaboratorType(typeId: string, formData: FormData) {
  await assertAdmin();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Falta el nombre del tipo.");
  const nameEn = (formData.get("nameEn") as string)?.trim() || null;
  const isClient = formData.get("isClient") === "on";

  await prisma.collaboratorTypeOption.update({
    where: { id: typeId },
    data: { name, nameEn, isClient },
  });

  revalidatePath("/admin/tipos-colaborador");
  revalidatePath("/admin/colaboradores");
  revalidatePath("/", "layout");
}

export async function deleteCollaboratorType(typeId: string, _formData: FormData) {
  await assertAdmin();

  const type = await prisma.collaboratorTypeOption.findUnique({
    where: { id: typeId },
    include: { _count: { select: { collaborators: true } } },
  });
  if (!type) return;

  if (type._count.collaborators > 0) {
    throw new Error(
      `No se puede borrar "${type.name}" porque hay ${type._count.collaborators} colaborador(es) usándolo. Cambiales el tipo primero.`
    );
  }

  await prisma.collaboratorTypeOption.delete({ where: { id: typeId } });

  revalidatePath("/admin/tipos-colaborador");
  revalidatePath("/admin/colaboradores");
}
