"use server";

import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { grantAlbum } from "@/lib/private-albums";
import { prisma } from "@/lib/prisma";

export async function unlockAlbum(id: string, locale: string, data: FormData) {
  const path = `/${locale === "en" ? "en" : "es"}/privado/${id}`;
  const password = String(data.get("password") ?? "");
  const album = await prisma.privateAlbum.findUnique({ where: { id } });
  if (!album || !password || Buffer.byteLength(password) > 72) redirect(`${path}?error=1`);

  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-vercel-forwarded-for") ?? "unknown";
  const visitor = createHash("sha256").update(ip).digest("hex");
  const window = Math.floor(Date.now() / 900_000);
  const [attempt] = await prisma.$transaction([
    prisma.privateAlbumAttempt.upsert({
      where: { albumId_visitor_window: { albumId: id, visitor, window } },
      create: { albumId: id, visitor, window },
      update: { count: { increment: 1 } },
    }),
    prisma.privateAlbumAttempt.deleteMany({ where: { albumId: id, window: { lt: window - 1 } } }),
  ]);
  if (attempt.count > 10) redirect(`${path}?error=2`);
  if (!(await bcrypt.compare(password, album.passwordHash))) redirect(`${path}?error=1`);
  await prisma.privateAlbumAttempt.deleteMany({ where: { albumId: id, visitor, window } });
  await grantAlbum(id, album.accessVersion);
  redirect(path);
}
