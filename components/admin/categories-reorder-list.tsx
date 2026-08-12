"use client";

import Link from "next/link";
import { ReorderButtons } from "./reorder-buttons";

type Category = {
  id: string;
  name: string;
  themeMode: string;
  themeName: string | null;
};

export function CategoriesReorderList({
  categories,
  moveAction,
}: {
  categories: Category[];
  moveAction: (categoryId: string, direction: "up" | "down") => Promise<void>;
}) {
  return (
    <div className="space-y-2">
      {categories.map((c, i) => (
        <div key={c.id} className="glass flex items-center gap-3 rounded-xl px-4 py-3">
          <ReorderButtons
            onMove={(direction) => moveAction(c.id, direction)}
            disableUp={i === 0}
            disableDown={i === categories.length - 1}
          />
          <Link href={`/admin/categorias/${c.id}`} data-cursor="magnetic" className="flex flex-1 items-center justify-between">
            <span>{c.name}</span>
            <span className="font-mono text-[11px] text-[var(--ink-muted)]">
              {c.themeMode === "manual" ? `Manual · ${c.themeName}` : "Auto"}
            </span>
          </Link>
        </div>
      ))}
    </div>
  );
}
