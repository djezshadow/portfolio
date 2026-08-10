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

export async function createCollaborator(formData: FormData) {
  await assertAdmin();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Falta el nombre.");

  const type = String(formData.get("type") ?? "").trim() || "creative";
  const instagram = (formData.get("instagram") as string) || null;
  const website = (formData.get("website") as string) || null;

  let logoUrl: string | null = null;
  const logo = formData.get("logo") as File | null;

  if (logo && logo.size > 0) {
    const buffer = Buffer.from(await logo.arrayBuffer());
    const webp = await sharp(buffer).resize(400, 400, { fit: "inside" }).webp({ quality: 85 }).toBuffer();
    const blob = await put(`collaborators/${Date.now()}.webp`, webp, {
      access: "public",
      contentType: "image/webp",
    });
    logoUrl = blob.url;
  }

  await prisma.collaborator.create({
    data: { name, type, instagram, website, logoUrl },
  });

  revalidatePath("/admin/colaboradores");
  redirect("/admin/colaboradores");
}

export async function updateCollaborator(collaboratorId: string, formData: FormData) {
  await assertAdmin();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Falta el nombre.");

  const type = String(formData.get("type") ?? "").trim() || "creative";
  const instagram = (formData.get("instagram") as string) || null;
  const website = (formData.get("website") as string) || null;

  const data: Record<string, unknown> = { name, type, instagram, website };

  const logo = formData.get("logo") as File | null;
  if (logo && logo.size > 0) {
    const buffer = Buffer.from(await logo.arrayBuffer());
    const webp = await sharp(buffer).resize(400, 400, { fit: "inside" }).webp({ quality: 85 }).toBuffer();
    const blob = await put(`collaborators/${Date.now()}.webp`, webp, {
      access: "public",
      contentType: "image/webp",
    });
    data.logoUrl = blob.url;
  }

  await prisma.collaborator.update({ where: { id: collaboratorId }, data });

  revalidatePath("/admin/colaboradores");
  redirect("/admin/colaboradores");
}

export async function deleteCollaborator(collaboratorId: string, _formData: FormData) {
  await assertAdmin();

  const collaborator = await prisma.collaborator.findUnique({ where: { id: collaboratorId } });
  if (collaborator?.logoUrl) {
    try {
      await del(collaborator.logoUrl);
    } catch {
      // ignorar si ya no existe
    }
  }

  await prisma.collaborator.delete({ where: { id: collaboratorId } });

  revalidatePath("/admin/colaboradores");
  redirect("/admin/colaboradores");
}
