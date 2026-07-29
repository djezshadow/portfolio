import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getDictionary, type Locale } from "@/lib/i18n/dictionaries";
import { Reveal } from "@/components/reveal";

export const dynamic = "force-dynamic";

export default async function ColaboradoresPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" ? "en" : "es";
  const dict = getDictionary(locale);

  let collaborators: Awaited<ReturnType<typeof prisma.collaborator.findMany>> = [];
  try {
    collaborators = await prisma.collaborator.findMany({ orderBy: { name: "asc" } });
  } catch {
    // sin DB disponible
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <Reveal>
        <h1 className="font-display text-4xl sm:text-5xl">
          {locale === "en" ? "Who I've worked with" : "Con quién trabajé"}
        </h1>
      </Reveal>

      <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {collaborators.map((c, i) => {
          const link = c.instagram || c.website;
          const content = (
            <>
              {c.logoUrl ? (
                <div className="relative h-16 w-16 overflow-hidden rounded-full bg-black/10">
                  <Image src={c.logoUrl} alt={c.name} fill className="object-cover" />
                </div>
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/10 font-display text-xl">
                  {c.name.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-display text-sm">{c.name}</p>
                <p className="font-mono text-[10px] text-[var(--ink-muted)]">
                  {c.type === "client"
                    ? locale === "en"
                      ? "Client"
                      : "Cliente"
                    : locale === "en"
                      ? "Creative collaborator"
                      : "Colaborador creativo"}
                </p>
              </div>
            </>
          );

          return (
            <Reveal key={c.id} delay={i * 0.04}>
              {link ? (
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor="magnetic"
                  className="glass flex flex-col items-center gap-3 rounded-2xl p-6 text-center"
                >
                  {content}
                </a>
              ) : (
                <div
                  data-cursor="magnetic"
                  className="glass flex flex-col items-center gap-3 rounded-2xl p-6 text-center"
                >
                  {content}
                </div>
              )}
            </Reveal>
          );
        })}
      </div>

      {collaborators.length === 0 && (
        <p className="mt-8 font-mono text-sm text-[var(--ink-muted)]">{dict.category.empty}</p>
      )}
    </div>
  );
}
