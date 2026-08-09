import Link from "next/link";
import { Carousel, type CarouselItem } from "@/components/carousel";
import { Reveal } from "@/components/reveal";
import { CollaboratorCard } from "@/components/collaborator-card";
import { prisma } from "@/lib/prisma";
import { getDictionary, type Locale } from "@/lib/i18n/dictionaries";
import { loc, locOrNull } from "@/lib/i18n/content";
import { getSiteSettings } from "@/lib/site-settings";

// Sin esto, Vercel puede servir una versión en caché vieja de la home
// después de guardar cambios en Configuración (hero, carrusel, portadas de
// categoría) — es la causa de "cambio el estilo del carrusel y no pasa
// nada". El resto de las páginas que dependen de SiteSettings ya la tenían.
export const dynamic = "force-dynamic";

const fallback: CarouselItem[] = [
  { id: "1", code: "SC-01", title: "Cortometrajes", subtitle: "6 proyectos" },
  { id: "2", code: "SC-02", title: "Comerciales", subtitle: "12 proyectos" },
  { id: "3", code: "SC-03", title: "Música", subtitle: "9 proyectos" },
  { id: "4", code: "SC-04", title: "Documentales", subtitle: "4 proyectos" },
];

async function getFeaturedCategories(locale: Locale): Promise<{ items: CarouselItem[]; slugs: Record<string, string>; live: boolean }> {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { order: "asc" },
      where: { isComingSoon: false },
      include: { projects: true },
    });
    if (categories.length === 0) return { items: fallback, slugs: {}, live: false };

    const slugs: Record<string, string> = {};
    const items = categories.map((c, i) => {
      slugs[c.id] = c.slug;
      return {
        id: c.id,
        code: `SC-${String(i + 1).padStart(2, "0")}`,
        title: loc(c.name, c.nameEn, locale),
        subtitle: `${c.projects.length} proyectos`,
        coverImageUrl: c.coverImageUrl,
      };
    });
    return { items, slugs, live: true };
  } catch {
    return { items: fallback, slugs: {}, live: false };
  }
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" ? "en" : "es";
  const dict = getDictionary(locale);
  const { items, slugs, live } = await getFeaturedCategories(locale);

  let heroTitle1: string = dict.hero.title1;
  let heroTitle2: string = dict.hero.title2;
  let heroSubtitle: string = dict.hero.subtitle;
  let carouselPreset: "cards" | "minimal" | "stack" = "cards";
  try {
    const settings = await getSiteSettings();
    heroTitle1 = locOrNull(settings.heroTitle1, settings.heroTitle1En, locale) || dict.hero.title1;
    heroTitle2 = locOrNull(settings.heroTitle2, settings.heroTitle2En, locale) || dict.hero.title2;
    heroSubtitle = locOrNull(settings.heroSubtitle, settings.heroSubtitleEn, locale) || dict.hero.subtitle;
    if (settings.carouselPreset === "minimal" || settings.carouselPreset === "stack") {
      carouselPreset = settings.carouselPreset;
    }
  } catch {
    // sin DB disponible, seguimos con los textos por defecto del diccionario
  }

  let collaborators: {
    id: string;
    name: string;
    logoUrl: string | null;
    type: string;
    instagram: string | null;
    website: string | null;
    typeOption: { isClient: boolean } | null;
    participants: {
      id: string;
      name: string | null;
      role: string | null;
      roleEn: string | null;
      instagram: string | null;
      website: string | null;
    }[];
  }[] = [];
  try {
    collaborators = await prisma.collaborator.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        type: true,
        instagram: true,
        website: true,
        typeOption: { select: { isClient: true } },
        participants: {
          orderBy: { order: "asc" },
          select: { id: true, name: true, role: true, roleEn: true, instagram: true, website: true },
        },
      },
    });
  } catch {
    // sin DB disponible
  }
  const clients = collaborators.filter((c) => c.typeOption?.isClient ?? c.type === "client");
  const creatives = collaborators.filter((c) => !(c.typeOption?.isClient ?? c.type === "client"));

  return (
    <div className="mx-auto max-w-6xl px-6">
      {/* HERO */}
      <section className="flex min-h-[70vh] flex-col justify-center gap-6">
        <Reveal>
          <span className="font-mono text-xs text-accent">{dict.hero.reel} — 00:00:00:00</span>
        </Reveal>
        <Reveal delay={0.1}>
          <h1 className="font-display text-5xl leading-[1.05] sm:text-7xl">
            {heroTitle1}
            <br />
            {heroTitle2}
          </h1>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="max-w-md font-body text-[var(--ink-muted)]">{heroSubtitle}</p>
        </Reveal>
      </section>

      {/* CATEGORÍAS — carpetas estéticas, carrusel configurable (3-10 ítems) */}
      <section className="pb-24">
        <Reveal>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-mono text-xs uppercase tracking-widest text-[var(--ink-muted)]">
              {dict.featured.label}
            </h2>
            {!live && (
              <span className="font-mono text-[10px] text-[var(--ink-muted)]">
                {dict.featured.sampleNotice}
              </span>
            )}
          </div>
        </Reveal>

        {live ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/${locale}/categoria/${slugs[item.id]}`}
                data-cursor="magnetic"
                className="glass rounded-2xl p-6 transition-transform hover:-translate-y-1"
              >
                <span className="font-mono text-[11px] text-accent">{item.code}</span>
                <h3 className="font-display text-xl">{item.title}</h3>
                <p className="text-sm text-[var(--ink-muted)]">{item.subtitle}</p>
              </Link>
            ))}
          </div>
        ) : (
          <Carousel items={items} preset={carouselPreset} />
        )}

        <a
          href="/api/reel-pdf"
          data-cursor="magnetic"
          className="glass mt-8 inline-block rounded-full px-5 py-2 font-mono text-xs"
        >
          {dict.nav.downloadReel} ↓
        </a>
      </section>

      {collaborators.length > 0 && (
        <section className="pb-24">
          <h2 className="mb-12 text-center font-display text-2xl sm:text-3xl">
            {locale === "en" ? "Who I've worked with" : "Con quién trabajé"}
          </h2>

          {clients.length > 0 && (
            <div className="mb-14">
              <p className="mb-6 text-center font-mono text-xs uppercase tracking-widest text-[var(--ink-muted)]">
                {locale === "en" ? "Clients" : "Clientes"}
              </p>
              <div className="flex flex-wrap items-start justify-center gap-x-10 gap-y-8">
                {clients.map((c) => (
                  <CollaboratorCard key={c.id} collaborator={c} locale={locale} />
                ))}
              </div>
            </div>
          )}

          {creatives.length > 0 && (
            <div>
              <p className="mb-6 text-center font-mono text-xs uppercase tracking-widest text-[var(--ink-muted)]">
                {locale === "en" ? "Collaborators" : "Colaboradores"}
              </p>
              <div className="flex flex-wrap items-start justify-center gap-x-10 gap-y-8">
                {creatives.map((c) => (
                  <CollaboratorCard key={c.id} collaborator={c} locale={locale} />
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
