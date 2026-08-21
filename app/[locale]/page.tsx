import { Carousel, type CarouselItem, type CarouselPreset, type CarouselStyleConfig } from "@/components/carousel";
import { Reveal } from "@/components/reveal";
import { CollaboratorCard } from "@/components/collaborator-card";
import { prisma } from "@/lib/prisma";
import { getDictionary, type Locale } from "@/lib/i18n/dictionaries";
import { loc, locOrNull } from "@/lib/i18n/content";
import { getSiteSettings } from "@/lib/site-settings";
import { SiteLogo } from "@/components/site-logo";
import { getProfile } from "@/lib/profile";
import { CvDownloadLink } from "@/components/cv-download-link";
import { getCollaboratorTypes } from "@/lib/collaborator-types";
import { InstagramFeed } from "@/components/instagram-feed";

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
        href: c.isComingSoon ? undefined : `/${locale}/categoria/${c.slug}`,
        isComingSoon: c.isComingSoon,
        hint: locOrNull(c.comingSoonHint, c.comingSoonHintEn, locale),
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
  const { items, live } = await getFeaturedCategories(locale);

  let heroTitle1: string = dict.hero.title1;
  let heroTitle2: string = dict.hero.title2;
  let heroSubtitle: string = dict.hero.subtitle;
  let heroKicker: string = dict.hero.reel;
  let heroKickerShowTimecode = true;
  let carouselPreset: CarouselPreset = "cards";
  let carouselStyle: CarouselStyleConfig = {};
  let homeAlign: "left" | "center" | "right" = "left";
  let embeddedLogo: { noirUrl: string | null; neonUrl: string | null; size: number; sizeMobile: number } | null = null;
  let cvEnabled = false;
  let instagramEnabled = false;
  let instagramHandle: string | null = null;
  let instagramTitle: string = "";
  try {
    const [settings, profile] = await Promise.all([getSiteSettings(), getProfile()]);
    cvEnabled = profile.cvEnabled;
    heroTitle1 = locOrNull(settings.heroTitle1, settings.heroTitle1En, locale) || dict.hero.title1;
    heroTitle2 = locOrNull(settings.heroTitle2, settings.heroTitle2En, locale) || dict.hero.title2;
    heroSubtitle = locOrNull(settings.heroSubtitle, settings.heroSubtitleEn, locale) || dict.hero.subtitle;
    heroKicker = locOrNull(settings.heroKicker, settings.heroKickerEn, locale) || dict.hero.reel;
    heroKickerShowTimecode = settings.heroKickerShowTimecode;
    const validPresets: CarouselPreset[] = ["cards", "minimal", "stack", "filmstrip", "editorial", "marquee", "split", "polaroid"];
    if (validPresets.includes(settings.carouselPreset as CarouselPreset)) {
      carouselPreset = settings.carouselPreset as CarouselPreset;
    }
    carouselStyle = {
      itemSize: (settings.carouselItemSize as "sm" | "md" | "lg") || "md",
      gap: settings.carouselGap,
      background: (settings.carouselBackground as "transparent" | "surface") || "transparent",
      shadow: settings.carouselShadow,
      glass: settings.carouselGlass,
    };
    if (["left", "center", "right"].includes(settings.homeAlign)) {
      homeAlign = settings.homeAlign as "left" | "center" | "right";
    }
    if (!settings.logoFloating) {
      embeddedLogo = {
        noirUrl: settings.logoNoirUrl,
        neonUrl: settings.logoNeonUrl,
        size: settings.logoSize,
        sizeMobile: settings.logoSizeMobile,
      };
    }
    if (settings.instagramFeedEnabled) {
      instagramEnabled = true;
      instagramHandle = settings.instagramHandle;
      instagramTitle = locOrNull(settings.instagramFeedTitle, settings.instagramFeedTitleEn, locale) || dict.instagram.label;
    }
  } catch {
    // sin DB disponible, seguimos con los textos por defecto del diccionario
  }

  let instagramFeedPosts: { id: string; url: string; caption: string | null }[] = [];
  let instagramHighlightPosts: { id: string; url: string; caption: string | null }[] = [];
  if (instagramEnabled) {
    try {
      const posts = await prisma.instagramPost.findMany({ orderBy: { order: "asc" } });
      instagramFeedPosts = posts.filter((p) => p.section === "feed");
      instagramHighlightPosts = posts.filter((p) => p.section === "highlight");
    } catch {
      // sin DB disponible
    }
  }

  let collaborators: {
    id: string;
    name: string;
    logoUrl: string | null;
    type: string;
    instagram: string | null;
    website: string | null;
    participants: {
      id: string;
      name: string | null;
      role: string | null;
      roleEn: string | null;
      instagram: string | null;
      website: string | null;
    }[];
  }[] = [];
  let collaboratorTypes: { slug: string; name: string; nameEn: string | null }[] = [];
  try {
    [collaborators, collaboratorTypes] = await Promise.all([
      prisma.collaborator.findMany({
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          logoUrl: true,
          type: true,
          instagram: true,
          website: true,
          participants: {
            orderBy: { order: "asc" },
            select: { id: true, name: true, role: true, roleEn: true, instagram: true, website: true },
          },
        },
      }),
      getCollaboratorTypes(),
    ]);
  } catch {
    // sin DB disponible
  }
  // Cada tipo de relación tiene su propia sección en la home, en el
  // orden en que están definidos (mismo criterio que /colaboradores) —
  // ya no son solo "Clientes"/"Colaboradores" fijos.
  const collaboratorSections = collaboratorTypes
    .map((t) => ({
      key: t.slug,
      title: loc(t.name, t.nameEn, locale),
      list: collaborators.filter((c) => c.type === t.slug),
    }))
    .filter((s) => s.list.length > 0);

  return (
    <div className="mx-auto max-w-6xl px-6">
      {embeddedLogo && (embeddedLogo.noirUrl || embeddedLogo.neonUrl) && (
        <Reveal>
          {/* Logo "deslizable" (modo no-fijo): esquina superior izquierda
              en desktop, centrado arriba en mobile — en las dos casos
              debajo de la barra de timecode, y en las dos scrollea con
              el resto del contenido (a diferencia del modo fijo, que
              vive en FloatingNav). */}
          <div className="flex justify-center pb-4 pt-14 sm:hidden">
            <SiteLogo
              locale={locale}
              noirLogoUrl={embeddedLogo.noirUrl}
              neonLogoUrl={embeddedLogo.neonUrl}
              size={embeddedLogo.sizeMobile}
              plain
            />
          </div>
          <div className="hidden pb-4 pt-14 sm:block">
            <SiteLogo
              locale={locale}
              noirLogoUrl={embeddedLogo.noirUrl}
              neonLogoUrl={embeddedLogo.neonUrl}
              size={embeddedLogo.size}
              plain
            />
          </div>
        </Reveal>
      )}

      {/* HERO */}
      <section
        className={`flex min-h-[70vh] flex-col justify-center gap-6 ${
          homeAlign === "center"
            ? "items-center text-center"
            : homeAlign === "right"
              ? "items-end text-right"
              : "items-start text-left"
        }`}
      >
        <Reveal>
          <span className="font-mono text-xs text-accent">
            {heroKicker.toUpperCase()}
            {heroKickerShowTimecode && " — 00:00:00:00"}
          </span>
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

        <Carousel
          items={items}
          preset={carouselPreset}
          style={carouselStyle}
          comingSoonLabel={locale === "en" ? "Coming soon" : "Próximamente"}
        />

        <div
          className={`mt-8 flex flex-wrap gap-3 ${
            homeAlign === "center" ? "justify-center" : homeAlign === "right" ? "justify-end" : ""
          }`}
        >
          <a
            href="/api/reel-pdf"
            data-cursor="magnetic"
            className="glass inline-block rounded-full px-5 py-2 font-mono text-xs"
          >
            {dict.nav.downloadReel} ↓
          </a>
          {cvEnabled && (
            <CvDownloadLink
              href={`/api/cv-pdf?locale=${locale}`}
              label={`${locale === "en" ? "Download CV" : "Descargar CV"} ↓`}
              locale={locale}
              className="inline-block rounded-full bg-[var(--accent)] px-5 py-2 font-mono text-xs text-[var(--bg)]"
            />
          )}
        </div>
      </section>

      {collaborators.length > 0 && (
        <section className="pb-24">
          <h2 className="mb-12 text-center font-display text-2xl sm:text-3xl">
            {locale === "en" ? "Who I've worked with" : "Con quién trabajé"}
          </h2>

          {collaboratorSections.map((s, i) => (
            <div key={s.key} className={i < collaboratorSections.length - 1 ? "mb-14" : ""}>
              <p className="mb-6 text-center font-mono text-xs uppercase tracking-widest text-[var(--ink-muted)]">
                {s.title}
              </p>
              <div className="flex flex-wrap items-start justify-center gap-x-10 gap-y-8">
                {s.list.map((c) => (
                  <CollaboratorCard key={c.id} collaborator={c} locale={locale} />
                ))}
              </div>
            </div>
          ))}
        </section>
      )}
      {instagramEnabled && (instagramFeedPosts.length > 0 || instagramHighlightPosts.length > 0) && (
        <InstagramFeed
          title={instagramTitle}
          handle={instagramHandle}
          feed={instagramFeedPosts}
          highlights={instagramHighlightPosts}
          labels={{ feed: dict.instagram.feed, highlights: dict.instagram.highlights, followOn: dict.instagram.followOn }}
        />
      )}
    </div>
  );
}
