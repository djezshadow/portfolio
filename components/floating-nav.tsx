import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { loc } from "@/lib/i18n/content";
import { getDictionary, type Locale } from "@/lib/i18n/dictionaries";
import { ThemeToggle } from "@/components/theme-toggle";
import { SiteLogo } from "@/components/site-logo";
import { MobileNav } from "@/components/mobile-nav";
import { getSiteSettings } from "@/lib/site-settings";

export async function FloatingNav({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const otherLocale = locale === "es" ? "en" : "es";
  let categories: { slug: string; name: string; nameEn: string | null }[] = [];
  let logos = { logoNoirUrl: null as string | null, logoNeonUrl: null as string | null };
  let aboutEnabled = false;

  try {
    categories = await prisma.category.findMany({
      where: { showInNav: true },
      orderBy: { order: "asc" },
      select: { slug: true, name: true, nameEn: true },
    });
  } catch {
    // sin DB disponible, la nav igual muestra Home + Contacto
  }

  try {
    const settings = await getSiteSettings();
    logos = settings;
    aboutEnabled = settings.aboutEnabled;
  } catch {
    // sin DB disponible, se usa el wordmark de texto
  }

  const links = [
    ...categories.map((c) => ({
      href: `/${locale}/categoria/${c.slug}`,
      label: loc(c.name, c.nameEn, locale),
    })),
    ...(aboutEnabled ? [{ href: `/${locale}/sobre-mi`, label: dict.nav.about }] : []),
    { href: `/${locale}/colaboradores`, label: locale === "en" ? "Collaborators" : "Colaboradores" },
    { href: `/${locale}/contacto`, label: dict.nav.contact },
  ];

  return (
    <div data-floating-nav>
      {/* Logo: arriba a la izquierda en desktop, centrado arriba en celular
          (item de rediseño de navbar). */}
      <div className="fixed inset-x-0 top-4 z-[100] flex justify-center sm:inset-x-auto sm:left-4 sm:justify-start">
        <div className="nav-surface rounded-full">
          <SiteLogo locale={locale} noirLogoUrl={logos.logoNoirUrl} neonLogoUrl={logos.logoNeonUrl} />
        </div>
      </div>

      {/* Links centrales: solo en desktop — en celular viven en el sidebar. */}
      <nav className="fixed inset-x-0 top-16 z-[100] mx-auto hidden w-fit max-w-[calc(100%-24px)] items-center gap-1 rounded-full px-2 py-2 font-mono text-sm sm:flex sm:top-4 nav-surface">
        <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              data-cursor="magnetic"
              className="shrink-0 rounded-full px-3 py-2 text-[var(--ink-muted)] transition-colors hover:text-accent"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* EN/ES + tema: arriba a la derecha en desktop. En celular se
          reemplaza por el botón de hamburguesa que abre el sidebar. */}
      <div className="fixed right-4 top-4 z-[100] hidden items-center gap-2 sm:flex">
        <Link
          href={`/${otherLocale}`}
          data-cursor="magnetic"
          className="nav-surface rounded-full px-3 py-2 font-mono text-sm text-[var(--ink-muted)] transition-colors hover:text-accent"
        >
          {otherLocale.toUpperCase()}
        </Link>
        <ThemeToggle />
      </div>

      <div className="fixed right-4 top-4 z-[100] sm:hidden">
        <MobileNav
          links={links}
          otherLocaleHref={`/${otherLocale}`}
          otherLocaleLabel={otherLocale.toUpperCase()}
        />
      </div>
    </div>
  );
}
