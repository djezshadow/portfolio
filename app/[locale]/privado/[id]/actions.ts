"use server";

import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { grantAlbum } from "@/lib/private-albums";
import { prisma } from "@/lib/prisma";

export async function unlockAlbum(id: string, data: FormData) {
  const password = String(data.get("password") ?? "");
  const album = await prisma.privateAlbum.findUnique({ where: { id } });
  if (!album || !password || Buffer.byteLength(password) > 72) return { error: "incorrect" } as const;

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
  if (attempt.count > 10) return { error: "limited" } as const;
  if (!(await bcrypt.compare(password, album.passwordHash))) return { error: "incorrect" } as const;
  await prisma.privateAlbumAttempt.deleteMany({ where: { albumId: id, visitor, window } });
  const photos = await prisma.privatePhoto.findMany({
    where: { albumId: id, album: { accessVersion: album.accessVersion } },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { id: true, alt: true },
  });
  const token = await grantAlbum(id, album.accessVersion);
  return { photos, token } as const;
}
