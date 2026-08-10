import { prisma } from "./prisma";

export async function getProfile() {
  const existing = await prisma.profile.findUnique({
    where: { id: "default" },
    include: {
      skills: { orderBy: { order: "asc" } },
      experiences: { orderBy: { order: "asc" } },
    },
  });
  if (existing) return existing;

  // Solo la primera vez (fila todavía no creada) hace falta el upsert.
  return prisma.profile.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
    include: {
      skills: { orderBy: { order: "asc" } },
      experiences: { orderBy: { order: "asc" } },
    },
  });
}
