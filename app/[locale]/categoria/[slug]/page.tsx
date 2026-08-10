import { cookies } from "next/headers";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CategoryView } from "@/components/category-view";
import { ComingSoon } from "@/components/coming-soon";
import { notFound } from "next/navigation";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { getDictionary, type Locale } from "@/lib/i18n/dictionaries";
import { loc, locOrNull } from "@/lib/i18n/content";

function normalizeLocale(raw: string): Locale {
  return raw === "en" ? "en" : "es";
}

// Esta ruta ya es dinámica por naturaleza (lee cookies para el preview del
// admin y las categorías se crean/borran en vivo desde el CMS), así que no
// tiene sentido pre-generar rutas estáticas en build time — eso obligaba a
// consultar la base durante el build de Vercel, un paso donde a veces las
// env vars no están garantizadas de la misma forma que en runtime.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      projects: {
        where: { project: { publishedAt: { lte: new Date() } } },
        include: { project: { include: { media: true } } },
        take: 1,
      },
    },
  });

  if (!category) return {};

  if (category.isComingSoon) {
    return { title: "?", description: "…" };
  }

  const name = loc(category.name, category.nameEn, locale);
  const title = locOrNull(category.metaTitle, category.metaTitleEn, locale) || `${name} — DJEZSHADOW®`;
  const description =
    locOrNull(category.metaDescription, category.metaDescriptionEn, locale) ||
    `Proyectos de ${name} filmados y editados por DJEZSHADOW.`;
  const ogImage = category.projects[0]?.project.media.find((m) => m.type === "image")?.url;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const isAdmin = token ? await verifySessionToken(token) : false;

  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      style: true,
      projects: {
        // Un visitante normal solo ve proyectos ya publicados (publishedAt <= ahora).
        // Un admin logueado ve todo, incluyendo borradores/programados (vista previa).
        where: isAdmin ? {} : { project: { publishedAt: { lte: new Date() } } },
        include: {
          project: {
            include: {
              media: { orderBy: { order: "asc" } },
              mediaGroups: { orderBy: { order: "asc" } },
              collaborator: true,
            },
          },
        },
      },
    },
  });

  if (!category) notFound();

  // Item #47: categoría "incógnita" — muestra un coming soon con pistas en vez
  // de los proyectos, salvo que seas vos mismo logueado como admin (preview).
  if (category.isComingSoon && !isAdmin) {
    const hint = locOrNull(category.comingSoonHint, category.comingSoonHintEn, locale);
    return <ComingSoon hint={hint} dict={dict} />;
  }

  return <CategoryView category={category} isPreview={isAdmin} dict={dict} locale={locale} />;
}
