import { prisma } from "@/lib/prisma";
import { getDictionary, type Locale } from "@/lib/i18n/dictionaries";
import { Reveal } from "@/components/reveal";
import { CollaboratorCard } from "@/components/collaborator-card";

export const dynamic = "force-dynamic";

export default async function ColaboradoresPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" ? "en" : "es";
  const dict = getDictionary(locale);

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

  function Section({ title, list }: { title: string; list: typeof collaborators }) {
    if (list.length === 0) return null;
    return (
      <section className="mb-16">
        <h2 className="mb-8 text-center font-display text-2xl sm:text-3xl">{title}</h2>
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
        <h1 className="text-center font-display text-4xl sm:text-5xl">
          {locale === "en" ? "Who I've worked with" : "Con quién trabajé"}
        </h1>
      </Reveal>

      <div className="mt-14">
        <Section title={locale === "en" ? "Clients" : "Clientes"} list={clients} />
        <Section title={locale === "en" ? "Collaborators" : "Colaboradores"} list={creatives} />
      </div>

      {collaborators.length === 0 && (
        <p className="mt-8 text-center font-mono text-sm text-[var(--ink-muted)]">{dict.category.empty}</p>
      )}
    </div>
  );
}
