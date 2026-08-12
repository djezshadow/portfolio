import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { loc, locOrNull } from "@/lib/i18n/content";
import { getDictionary, type Locale } from "@/lib/i18n/dictionaries";
import { ThemeToggle } from "@/components/theme-toggle";
import { SiteLogo } from "@/components/site-logo";
import { MobileNav } from "@/components/mobile-nav";
import { NavLinksDesktop } from "@/components/nav-links-desktop";
import { getSiteSettings } from "@/lib/site-settings";
import { getProfile } from "@/lib/profile";

export async function FloatingNav({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const otherLocale = locale === "es" ? "en" : "es";
  let categories: {
    slug: string;
    name: string;
    nameEn: string | null;
    isComingSoon: boolean;
    comingSoonHint: string | null;
    comingSoonHintEn: string | null;
  }[] = [];
  let logos = {
    logoNoirUrl: null as string | null,
    logoNeonUrl: null as string | null,
    logoFloating: false,
    logoSize: 64,
    logoSizeMobile: 40,
  };
  let aboutEnabled = false;
  let cvEnabled = false;
  let navOrder: string[] = [];

  try {
    categories = await prisma.category.findMany({
      where: { showInNav: true },
      orderBy: { order: "asc" },
      select: { slug: true, name: true, nameEn: true, isComingSoon: true, comingSoonHint: true, comingSoonHintEn: true },
    });
  } catch {
    // sin DB disponible, la nav igual muestra Home + Contacto
  }

  let navProjects: {
    id: string;
    title: string;
    titleEn: string | null;
    isComingSoon: boolean;
    comingSoonHint: string | null;
    comingSoonHintEn: string | null;
    categorySlug: string | null;
  }[] = [];
  try {
    const rows = await prisma.project.findMany({
      where: { showInNav: true, publishedAt: { lte: new Date() } },
      orderBy: { order: "asc" },
      select: {
        id: true,
        title: true,
        titleEn: true,
        isComingSoon: true,
        comingSoonHint: true,
        comingSoonHintEn: true,
        categories: { take: 1, select: { category: { select: { slug: true } } } },
      },
    });
    navProjects = rows.map((p) => ({
      id: p.id,
      title: p.title,
      titleEn: p.titleEn,
      isComingSoon: p.isComingSoon,
      comingSoonHint: p.comingSoonHint,
      comingSoonHintEn: p.comingSoonHintEn,
      categorySlug: p.categories[0]?.category.slug ?? null,
    }));
  } catch {
    // sin DB disponible, sin accesos directos de proyecto
  }

  try {
    const settings = await getSiteSettings();
    logos = settings;
    aboutEnabled = settings.aboutEnabled;
    if (settings.navOrder) {
      try {
        navOrder = JSON.parse(settings.navOrder);
      } catch {
        // JSON inválido — se usa el orden natural
      }
    }
  } catch {
    // sin DB disponible, se usa el wordmark de texto
  }

  try {
    const profile = await getProfile();
    cvEnabled = profile.cvEnabled;
  } catch {
    // sin DB disponible, no se muestra el link de CV
  }

  const links = [
    ...categories.map((c) => ({
      key: `category:${c.slug}`,
      href: `/${locale}/categoria/${c.slug}`,
      label: loc(c.name, c.nameEn, locale),
      isComingSoon: c.isComingSoon,
      hint: locOrNull(c.comingSoonHint, c.comingSoonHintEn, locale),
    })),
    ...navProjects
      .filter((p) => p.categorySlug)
      .map((p) => ({
        key: `project:${p.id}`,
        href: `/${locale}/categoria/${p.categorySlug}?proyecto=${p.id}`,
        label: loc(p.title, p.titleEn, locale),
        isComingSoon: p.isComingSoon,
        hint: locOrNull(p.comingSoonHint, p.comingSoonHintEn, locale),
      })),
    ...(aboutEnabled ? [{ key: "about", href: `/${locale}/sobre-mi`, label: dict.nav.about }] : []),
    { key: "colaboradores", href: `/${locale}/colaboradores`, label: locale === "en" ? "Collaborators" : "Colaboradores" },
    { key: "contacto", href: `/${locale}/contacto`, label: dict.nav.contact },
    ...(cvEnabled ? [{ key: "cv", href: `/api/cv-pdf?locale=${locale}`, label: "CV", emphasis: true }] : []),
  ];

  // Orden custom del navbar (item nuevo: "dejame elegir el orden") — los
  // items sin posición guardada (categorías/proyectos nuevos) quedan al
  // final, en su orden natural.
  if (navOrder.length > 0) {
    links.sort((a, b) => {
      const ia = navOrder.indexOf(a.key);
      const ib = navOrder.indexOf(b.key);
      if (ia === -1 && ib === -1) return 0;
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }

  return (
    <div data-floating-nav>
      {/* Logo: solo si el modo "Fijo" está activo (default). Sin caja,
          en las dos plataformas — mobile centrado arriba, desktop en la
          esquina superior izquierda. Si está en modo "Se desliza",
          no se muestra acá: aparece incrustado arriba de la portada de
          la home nomás (ver app/[locale]/page.tsx), y en el resto de las
          páginas directamente no hay logo fijo. */}
      {logos.logoFloating && (
        <>
          <div className="fixed inset-x-0 top-14 z-[100] flex justify-center sm:hidden">
            <SiteLogo
              locale={locale}
              noirLogoUrl={logos.logoNoirUrl}
              neonLogoUrl={logos.logoNeonUrl}
              size={logos.logoSizeMobile}
              plain
            />
          </div>
          <div className="fixed left-4 top-14 z-[100] hidden sm:flex">
            <SiteLogo
              locale={locale}
              noirLogoUrl={logos.logoNoirUrl}
              neonLogoUrl={logos.logoNeonUrl}
              size={logos.logoSize}
              plain
            />
          </div>
        </>
      )}

      {/* Links centrales: solo en desktop — en celular viven en el sidebar. */}
      <nav className="fixed inset-x-0 top-14 z-[100] mx-auto hidden w-fit max-w-[calc(100%-24px)] items-center gap-1 rounded-full px-2 py-2 font-mono text-sm sm:flex nav-surface">
        <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <NavLinksDesktop links={links} />
        </div>
      </nav>

      {/* EN/ES + tema: arriba a la derecha en desktop. En celular se
          reemplaza por el botón de hamburguesa que abre el sidebar. */}
      <div className="fixed right-4 top-14 z-[100] hidden items-center gap-2 sm:flex">
        <Link
          href={`/${otherLocale}`}
          data-cursor="magnetic"
          className="nav-surface rounded-full px-3 py-2 font-mono text-sm text-[var(--ink-muted)] transition-colors hover:text-accent"
        >
          {otherLocale.toUpperCase()}
        </Link>
        <ThemeToggle />
      </div>

      <div className="fixed right-4 top-14 z-[100] sm:hidden">
        <MobileNav
          links={links}
          otherLocaleHref={`/${otherLocale}`}
          otherLocaleLabel={otherLocale.toUpperCase()}
        />
      </div>
    </div>
  );
}
