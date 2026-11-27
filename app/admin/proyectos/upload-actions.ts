"use server";

import { del } from "@vercel/blob";
import { projectWebp } from "@/lib/managed-blob";
import { isAdmin } from "@/lib/private-albums";
import { prisma } from "@/lib/prisma";

export async function discardProjectUpload(value: string) {
  if (!(await isAdmin())) throw new Error("No autorizado");
  const url = projectWebp(value);
  const media = await prisma.media.findFirst({ where: { url }, select: { id: true } });
  if (media) return;
  await del(url);
}
