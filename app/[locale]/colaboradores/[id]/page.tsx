import Link from "next/link";
import { notFound } from "next/navigation";
import { WorkTile } from "@/components/selected-work";
import { prisma } from "@/lib/prisma";
import { publicProjectWhere, toWorkCard, workCardSelect } from "@/lib/public-projects";

export const dynamic = "force-dynamic";

export default async function CollaboratorWork({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale: language, id } = await params;
  const locale = language === "en" ? "en" : "es";
  const en = locale === "en";
  const collaborator = await prisma.collaborator.findUnique({
    where: { id },
    select: {
      name: true,
      projects: { where: publicProjectWhere(), orderBy: [{ publishedAt: "desc" }, { id: "asc" }], select: workCardSelect },
    },
  });
  if (!collaborator) notFound();
  return <main className="portfolio-page mx-auto max-w-6xl space-y-7 px-6 py-12">
    <Link className="inline-flex min-h-11 items-center text-sm text-accent hover:underline" href={`/${locale}/colaboradores`}>
      {en ? "All collaborators" : "Todos los colaboradores"}
    </Link>
    <h1 className="break-words font-display text-4xl sm:text-6xl">{en ? "Projects with" : "Trabajos con"} {collaborator.name}</h1>
    {collaborator.projects.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {collaborator.projects.map((project) => <WorkTile key={project.id} work={toWorkCard(project, locale)} locale={locale} />)}
    </div> : <p>{en ? "No published projects with this collaborator yet." : "Todavía no hay trabajos publicados con este colaborador."}</p>}
  </main>;
}
