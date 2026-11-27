import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { ReelDocument, type ReelCategory } from "@/lib/pdf/reel-document";
import { loc, locOrNull } from "@/lib/i18n/content";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const locale = new URL(request.url).searchParams.get("locale") === "en" ? "en" : "es";
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: {
      projects: {
        where: { project: { publishedAt: { lte: new Date() }, isComingSoon: false } },
        include: { project: { include: { collaborator: true, mediaGroups: true } } },
      },
    },
  });

  const data: ReelCategory[] = categories
    .filter((c) => !c.isComingSoon && c.projects.length > 0)
    .map((c) => ({
      name: loc(c.name, c.nameEn, locale),
      projects: c.projects.map(({ project }) => ({
        title: loc(project.title, project.titleEn, locale),
        role: locOrNull(project.role, project.roleEn, locale),
        collaboratorName: project.collaborator?.name ?? null,
        subcategories: project.mediaGroups.map((g) => loc(g.name, g.nameEn, locale)),
      })),
    }));

  const buffer = await renderToBuffer(<ReelDocument categories={data} en={locale === "en"} />);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="djezshadow-${locale === "en" ? "portfolio" : "dossier"}.pdf"`,
    },
  });
}
