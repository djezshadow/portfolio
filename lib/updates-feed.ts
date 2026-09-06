import { prisma } from "@/lib/prisma";

export type AutoSourceType = "project" | "category" | "instagram";

export type AutoCandidate = {
  sourceType: AutoSourceType;
  sourceId: string;
  title: string;
  titleEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  date: Date;
  /// Ruta relativa (sin locale) para lo interno, URL completa para
  /// Instagram (que siempre abre afuera).
  href: string;
  external: boolean;
};

const LIMIT_PER_SOURCE = 8;

/**
 * Junta lo último de Project/Category/InstagramPost, SIN aplicar
 * overrides todavía — se usa tal cual en el admin (para poder ocultar
 * o corregir cualquiera de estos), y con overrides aplicados para el
 * público (ver getPublicUpdatesFeed más abajo).
 */
export async function getAutoCandidates(): Promise<AutoCandidate[]> {
  const now = new Date();

  const [projects, categories, instagramPosts] = await Promise.all([
    prisma.project.findMany({
      where: { publishedAt: { not: null, lte: now } },
      orderBy: { publishedAt: "desc" },
      take: LIMIT_PER_SOURCE,
      include: { categories: { include: { category: true }, take: 1 } },
    }),
    prisma.category.findMany({
      orderBy: { createdAt: "desc" },
      take: LIMIT_PER_SOURCE,
    }),
    prisma.instagramPost.findMany({
      orderBy: { createdAt: "desc" },
      take: LIMIT_PER_SOURCE,
    }),
  ]);

  const projectItems: AutoCandidate[] = projects.map((p) => {
    const firstCat = p.categories[0]?.category;
    return {
      sourceType: "project",
      sourceId: p.id,
      title: p.title,
      titleEn: p.titleEn,
      description: firstCat ? `Nuevo proyecto en ${firstCat.name}` : "Nuevo proyecto",
      descriptionEn: firstCat ? `New project in ${firstCat.nameEn || firstCat.name}` : "New project",
      date: p.publishedAt ?? p.createdAt,
      href: firstCat ? `/categoria/${firstCat.slug}?proyecto=${p.id}` : "/",
      external: false,
    };
  });

  const categoryItems: AutoCandidate[] = categories.map((c) => ({
    sourceType: "category",
    sourceId: c.id,
    title: c.name,
    titleEn: c.nameEn,
    description: "Nueva categoría",
    descriptionEn: "New category",
    date: c.createdAt,
    href: `/categoria/${c.slug}`,
    external: false,
  }));

  // OJO: `title` de InstagramPost es una etiqueta PRIVADA para
  // orientarte en el admin (así se documentó cuando se agregó) — nunca
  // la usamos como texto público por default acá, para no filtrar algo
  // que pensaste como nota interna. Si en un caso puntual SÍ querés que
  // se vea, podés pisarlo a mano con el override en /admin/novedades.
  const instagramItems: AutoCandidate[] = instagramPosts.map((post) => ({
    sourceType: "instagram",
    sourceId: post.id,
    title: "Nuevo post de Instagram",
    titleEn: "New Instagram post",
    description: post.caption,
    descriptionEn: post.caption,
    date: post.createdAt,
    href: post.url,
    external: true,
  }));

  return [...projectItems, ...categoryItems, ...instagramItems].sort((a, b) => b.date.getTime() - a.date.getTime());
}

export type ResolvedUpdateItem = {
  key: string; // `${sourceType}:${sourceId}` o `manual:${id}`
  title: string;
  description: string | null;
  date: Date;
  href: string;
  external: boolean;
};

/**
 * Versión PÚBLICA: candidatos automáticos con overrides aplicados
 * (ocultos afuera, textos corregidos donde corresponda) + las entradas
 * manuales que se sigan cargando a mano — todo mezclado y ordenado por
 * fecha. `locale` resuelve qué idioma mostrar.
 */
export async function getPublicUpdatesFeed(locale: string, limit = 12): Promise<ResolvedUpdateItem[]> {
  const isEn = locale === "en";

  const [candidates, overrides, manual] = await Promise.all([
    getAutoCandidates(),
    prisma.updateFeedOverride.findMany(),
    prisma.updateLogEntry.findMany({ orderBy: { date: "desc" } }),
  ]);

  const overrideMap = new Map(overrides.map((o) => [`${o.sourceType}:${o.sourceId}`, o]));

  const autoResolved: ResolvedUpdateItem[] = candidates
    .map((c) => {
      const override = overrideMap.get(`${c.sourceType}:${c.sourceId}`);
      if (override?.hidden) return null;
      const title =
        (isEn ? override?.titleOverrideEn : override?.titleOverride) ||
        override?.titleOverride ||
        (isEn && c.titleEn ? c.titleEn : c.title);
      const description =
        (isEn ? override?.descriptionOverrideEn : override?.descriptionOverride) ||
        override?.descriptionOverride ||
        (isEn ? c.descriptionEn : c.description);
      return {
        key: `${c.sourceType}:${c.sourceId}`,
        title,
        description: description ?? null,
        date: c.date,
        href: c.href,
        external: c.external,
      };
    })
    .filter((x): x is ResolvedUpdateItem => x !== null);

  const manualResolved: ResolvedUpdateItem[] = manual.map((e) => ({
    key: `manual:${e.id}`,
    title: isEn && e.titleEn ? e.titleEn : e.title,
    description: (isEn ? e.descriptionEn : e.description) ?? null,
    date: e.date,
    href: "",
    external: false,
  }));

  return [...autoResolved, ...manualResolved].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, limit);
}
