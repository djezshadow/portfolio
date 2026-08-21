import { prisma } from "@/lib/prisma";
import { getDictionary, type Locale } from "@/lib/i18n/dictionaries";
import { loc } from "@/lib/i18n/content";
import { Reveal } from "@/components/reveal";
import { CollaboratorCard } from "@/components/collaborator-card";
import { getCollaboratorTypes } from "@/lib/collaborator-types";

export const dynamic = "force-dynamic";

type CollaboratorRow = {
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
};

export default async function ColaboradoresPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" ? "en" : "es";
  const dict = getDictionary(locale);

  let collaborators: CollaboratorRow[] = [];
  let types: Awaited<ReturnType<typeof getCollaboratorTypes>> = [];
  try {
    [collaborators, types] = await Promise.all([
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

  // Cada tipo de relación (item #14, más el fix de que "Prensa" caía
  // siempre en Colaboradores) tiene su propia sección, en el orden en
  // que están definidos los tipos — ya no son solo 2 baldes fijos.
  const sections = types
    .map((t) => ({
      key: t.slug,
      title: loc(t.name, t.nameEn, locale),
      list: collaborators.filter((c) => c.type === t.slug),
    }))
    .filter((s) => s.list.length > 0);

  // Por si algún colaborador quedó con un `type` que ya no existe como
  // opción (tipo borrado) — no lo perdemos, va a una sección genérica.
  const knownSlugs = new Set(types.map((t) => t.slug));
  const orphans = collaborators.filter((c) => !knownSlugs.has(c.type));
  if (orphans.length > 0) {
    sections.push({ key: "otros", title: locale === "en" ? "Others" : "Otros", list: orphans });
  }

  function Section({ title, list }: { title: string; list: CollaboratorRow[] }) {
    return (
      <section className="mb-16">
        {/* Label de sección distinto al de la home: ahí es una leyenda
            chica sin adornos; acá, al ser una página dedicada, lleva
            líneas a los costados — mismo espíritu tipográfico, pero no
            calcado (pedido explícito: que no se vean idénticos). */}
        <div className="mb-8 flex items-center justify-center gap-4">
          <span className="h-px w-10 bg-[var(--glass-border)]" />
          <h2 className="whitespace-nowrap font-mono text-xs uppercase tracking-[0.25em] text-accent">
            {title}
          </h2>
          <span className="h-px w-10 bg-[var(--glass-border)]" />
        </div>
        <div className="flex flex-wrap items-start justify-center gap-x-10 gap-y-8">
          {list.map((c, i) => (
            <Reveal key={c.id} delay={i * 0.04}>
              <CollaboratorCard collaborator={c} locale={locale} />
            </Reveal>
          ))}
        </div>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <Reveal>
        <h1 className="text-center font-display text-3xl sm:text-4xl">
          {locale === "en" ? "Who I've worked with" : "Con quién trabajé"}
        </h1>
      </Reveal>

      <div className="mt-14">
        {sections.map((s) => (
          <Section key={s.key} title={s.title} list={s.list} />
        ))}
      </div>

      {collaborators.length === 0 && (
        <p className="mt-8 text-center font-mono text-sm text-[var(--ink-muted)]">{dict.category.empty}</p>
      )}
    </div>
  );
}
