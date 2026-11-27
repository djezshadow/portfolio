"use server";

import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import sharp from "sharp";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/private-albums";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("No autorizado");
}

async function passwordHash(data: FormData) {
  const password = String(data.get("password") ?? "");
  if (password.trim().length < 8 || Buffer.byteLength(password) > 72) {
    throw new Error("Elegí una contraseña de al menos 8 caracteres y hasta 72 bytes.");
  }
  return bcrypt.hash(password, 12);
}

export async function createAlbum(data: FormData) {
  await requireAdmin();
  const name = String(data.get("name") ?? "").trim();
  if (!name || name.length > 100) throw new Error("Ingresá un nombre de hasta 100 caracteres.");
  await prisma.privateAlbum.create({ data: { name, passwordHash: await passwordHash(data) } });
  revalidatePath("/admin/privado");
}

export async function changeAlbumPassword(id: string, data: FormData) {
  await requireAdmin();
  const hash = await passwordHash(data);
  await prisma.$transaction([
    prisma.privateAlbum.update({ where: { id }, data: { passwordHash: hash, accessVersion: randomUUID() } }),
    prisma.privateAlbumAttempt.deleteMany({ where: { albumId: id } }),
  ]);
  revalidatePath("/admin/privado");
}

export async function uploadAlbumPhoto(id: string, data: FormData) {
  await requireAdmin();
  const photo = data.get("photo");
  if (!(photo instanceof File) || photo.type !== "image/webp" || !photo.size || photo.size > 4_000_000) {
    throw new Error("La foto WebP debe pesar menos de 4 MB.");
  }
  const image = sharp(Buffer.from(await photo.arrayBuffer()), { limitInputPixels: 30_000_000 });
  if ((await image.metadata()).format !== "webp") throw new Error("El archivo no es WebP.");
  const bytes = await image.rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true }).webp({ quality: 84 }).toBuffer();
  await prisma.privatePhoto.create({ data: {
    albumId: id, bytes: new Uint8Array(bytes), alt: String(data.get("alt") ?? "").trim().slice(0, 160),
  } });
  revalidatePath("/admin/privado");
}

export async function deleteAlbumPhoto(id: string) {
  await requireAdmin();
  await prisma.privatePhoto.delete({ where: { id } });
  revalidatePath("/admin/privado");
}

export async function deleteAlbum(id: string) {
  await requireAdmin();
  await prisma.privateAlbum.delete({ where: { id } });
  revalidatePath("/admin/privado");
}
