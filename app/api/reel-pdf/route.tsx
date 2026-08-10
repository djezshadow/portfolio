import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { ReelDocument, type ReelCategory } from "@/lib/pdf/reel-document";

export const runtime = "nodejs";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: {
      projects: {
        where: { project: { publishedAt: { lte: new Date() } } },
        include: { project: { include: { collaborator: true, mediaGroups: true } } },
      },
    },
  });

  const data: ReelCategory[] = categories
    .filter((c) => !c.isComingSoon && c.projects.length > 0)
    .map((c) => ({
      name: c.name,
      projects: c.projects.map(({ project }) => ({
        title: project.title,
        role: project.role,
        collaboratorName: project.collaborator?.name ?? null,
        subcategories: project.mediaGroups.map((g) => g.name),
      })),
    }));

  const buffer = await renderToBuffer(<ReelDocument categories={data} />);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="djezshadow-reel.pdf"',
    },
  });
}
