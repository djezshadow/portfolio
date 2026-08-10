import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CategoriasPage() {
  const categories = await prisma.category.findMany({ orderBy: { order: "asc" } });

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl">Categorías</h1>
        <Link
          href="/admin/categorias/nueva"
          data-cursor="magnetic"
          className="rounded-full bg-[var(--accent)] px-4 py-2 font-mono text-sm text-[var(--bg)]"
        >
          + Nueva
        </Link>
      </div>

      <div className="space-y-2">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/admin/categorias/${c.id}`}
            data-cursor="magnetic"
            className="glass flex items-center justify-between rounded-xl px-4 py-3"
          >
            <span>{c.name}</span>
            <span className="font-mono text-[11px] text-[var(--ink-muted)]">
              {c.themeMode === "manual" ? `Manual · ${c.themeName}` : "Auto"}
            </span>
          </Link>
        ))}

        {categories.length === 0 && (
          <p className="font-mono text-sm text-[var(--ink-muted)]">Todavía no hay categorías.</p>
        )}
      </div>
    </div>
  );
}
