import { prisma } from "./prisma";

export async function getSiteSettings() {
  return prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });
}
