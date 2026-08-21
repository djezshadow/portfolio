import Link from "next/link";
import { prisma } from "@/lib/prisma";

function statusLabel(publishedAt: Date | null) {
  if (!publishedAt) return { label: "Borrador", color: "var(--ink-muted)" };
  if (publishedAt > new Date()) return { label: "Programado", color: "var(--accent)" };
  return { label: "Publicado", color: "var(--accent-contrast)" };
}

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: {
      projects: {
        include: { project: true },
      },
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="font-display text-3xl">Panel</h1>
      <p className="mt-1 font-mono text-sm text-[var(--ink-muted)]">
        {categories.reduce((acc, c) => acc + c.projects.length, 0)} proyectos en{" "}
        {categories.length} categorías
      </p>

      <div className="mt-8 space-y-8">
        {categories.map((cat) => (
          <div key={cat.id}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-xl">{cat.name}</h2>
              <Link
                href={`/es/categoria/${cat.slug}`}
                data-cursor="magnetic"
                className="font-mono text-[11px] text-[var(--ink-muted)]"
              >
                ver página →
              </Link>
            </div>

            {cat.projects.length === 0 ? (
              <p className="font-mono text-sm text-[var(--ink-muted)]">Sin proyectos todavía.</p>
            ) : (
              <div className="space-y-2">
                {cat.projects.map(({ project }) => {
                  const status = statusLabel(project.publishedAt);
                  return (
                    <Link
                      key={project.id}
                      href={`/admin/proyectos/${project.id}`}
                      data-cursor="magnetic"
                      className="glass flex items-center justify-between rounded-xl px-4 py-3"
                    >
                      <span>{project.title}</span>
                      <span className="font-mono text-[11px]" style={{ color: status.color }}>
                        {status.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {categories.length === 0 && (
          <p className="font-mono text-sm text-[var(--ink-muted)]">
            No hay categorías creadas todavía.{" "}
            <a href="/admin/categorias/nueva" className="text-accent">Creá la primera acá →</a>
          </p>
        )}
      </div>
    </div>
  );
}
