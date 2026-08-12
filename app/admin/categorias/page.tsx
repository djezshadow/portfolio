import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { moveCategoryOrder } from "./actions";
import { CategoriesReorderList } from "@/components/admin/categories-reorder-list";

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

      <CategoriesReorderList categories={categories} moveAction={moveCategoryOrder} />

      {categories.length === 0 && (
        <p className="font-mono text-sm text-[var(--ink-muted)]">Todavía no hay categorías.</p>
      )}
    </div>
  );
}
