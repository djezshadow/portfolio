import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { loc } from "@/lib/i18n/content";
import { getDictionary, type Locale } from "@/lib/i18n/dictionaries";
import { ThemeToggle } from "@/components/theme-toggle";
import { SiteLogo } from "@/components/site-logo";
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

  return (
    <nav
      data-floating-nav
      className="nav-surface fixed inset-x-0 top-16 z-[100] mx-auto flex w-fit max-w-[calc(100%-24px)] items-center gap-1 rounded-full px-2 py-2 font-mono text-sm"
    >
      <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <SiteLogo locale={locale} noirLogoUrl={logos.logoNoirUrl} neonLogoUrl={logos.logoNeonUrl} />

        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/${locale}/categoria/${c.slug}`}
            data-cursor="magnetic"
            className="shrink-0 rounded-full px-3 py-2 text-[var(--ink-muted)] transition-colors hover:text-accent"
          >
            {loc(c.name, c.nameEn, locale)}
          </Link>
        ))}

        {aboutEnabled && (
          <Link
            href={`/${locale}/sobre-mi`}
            data-cursor="magnetic"
            className="shrink-0 rounded-full px-3 py-2 text-[var(--ink-muted)] transition-colors hover:text-accent"
          >
            {dict.nav.about}
          </Link>
        )}

        <Link
          href={`/${locale}/colaboradores`}
          data-cursor="magnetic"
          className="shrink-0 rounded-full px-3 py-2 text-[var(--ink-muted)] transition-colors hover:text-accent"
        >
          {locale === "en" ? "Collaborators" : "Colaboradores"}
        </Link>

        <Link
          href={`/${locale}/contacto`}
          data-cursor="magnetic"
          className="shrink-0 rounded-full px-3 py-2 text-[var(--ink-muted)] transition-colors hover:text-accent"
        >
          {dict.nav.contact}
        </Link>

        <Link
          href={`/${otherLocale}`}
          data-cursor="magnetic"
          className="shrink-0 rounded-full px-3 py-2 text-[var(--ink-muted)] transition-colors hover:text-accent"
        >
          {otherLocale.toUpperCase()}
        </Link>
      </div>

      <div className="shrink-0 pl-1">
        <ThemeToggle />
      </div>
    </nav>
  );
}
