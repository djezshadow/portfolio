import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { locales } from "@/lib/i18n/dictionaries";
import { publicProjectWhere } from "@/lib/public-projects";

const BASE_URL = process.env.SITE_URL || "https://djezshadow.vercel.app";

// Se genera por request (no en build time): así nunca depende de que la DB
// esté disponible durante el build de Vercel, y siempre refleja las
// categorías actuales sin necesitar un redeploy.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    entries.push({ url: `${BASE_URL}/${locale}`, lastModified: new Date(), priority: 1 });
    entries.push({ url: `${BASE_URL}/${locale}/contacto`, lastModified: new Date(), priority: 0.5 });
    entries.push({ url: `${BASE_URL}/${locale}/colaboradores`, lastModified: new Date(), priority: 0.6 });
  }

  try {
    const settings = await prisma.siteSettings.findUnique({ where: { id: "default" } });
    if (settings?.aboutEnabled) {
      for (const locale of locales) {
        entries.push({ url: `${BASE_URL}/${locale}/sobre-mi`, lastModified: new Date(), priority: 0.5 });
      }
    }
  } catch {
    // sin DB disponible, se omite esta entrada nomás
  }

  try {
    // Las categorías "coming soon" (incógnitas) no se listan a propósito.
    const categories = await prisma.category.findMany({
      where: { isComingSoon: false },
      select: { slug: true, updatedAt: true },
    });

    for (const locale of locales) {
      for (const c of categories) {
        entries.push({
          url: `${BASE_URL}/${locale}/categoria/${c.slug}`,
          lastModified: c.updatedAt,
          priority: 0.8,
        });
      }
    }
  } catch (err) {
    console.error("No se pudieron traer categorías para el sitemap:", err);
  }

  try {
    const projects = await prisma.project.findMany({
      where: publicProjectWhere(), select: { id: true, publishedAt: true },
    });
    for (const locale of locales) {
      for (const project of projects) entries.push({
        url: `${BASE_URL}/${locale}/proyecto/${project.id}`,
        lastModified: project.publishedAt ?? undefined,
      });
    }
  } catch (error) {
    console.error("No se pudieron traer proyectos para el sitemap", error);
  }

  return entries;
}
