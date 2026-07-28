import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { loc } from "@/lib/i18n/content";
import { getDictionary, type Locale } from "@/lib/i18n/dictionaries";

export async function FloatingNav({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  let categories: { slug: string; name: string; nameEn: string | null }[] = [];

  try {
    categories = await prisma.category.findMany({
      where: { showInNav: true },
      orderBy: { order: "asc" },
      select: { slug: true, name: true, nameEn: true },
    });
  } catch {
    // sin DB disponible, la nav igual muestra Home + Contacto
  }

  return (
    <nav
      data-floating-nav
      className="glass fixed bottom-5 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-1 rounded-full px-2 py-1.5 font-mono text-xs"
    >
      <Link
        href={`/${locale}`}
        data-cursor="magnetic"
        className="rounded-full px-3 py-1.5 text-[var(--ink-muted)] transition-colors hover:text-accent"
      >
        Home
      </Link>
      {categories.map((c) => (
        <Link
          key={c.slug}
          href={`/${locale}/categoria/${c.slug}`}
          data-cursor="magnetic"
          className="rounded-full px-3 py-1.5 text-[var(--ink-muted)] transition-colors hover:text-accent"
        >
          {loc(c.name, c.nameEn, locale)}
        </Link>
      ))}
      <Link
        href={`/${locale}/contacto`}
        data-cursor="magnetic"
        className="rounded-full px-3 py-1.5 text-[var(--ink-muted)] transition-colors hover:text-accent"
      >
        {dict.nav.contact}
      </Link>
    </nav>
  );
}
