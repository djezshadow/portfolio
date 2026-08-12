"use client";

import { useState } from "react";
import { ReorderButtons } from "@/components/admin/reorder-buttons";

type NavItem = { key: string; label: string; hidden?: string };

export function NavOrderPanel({
  initialItems,
  saveAction,
}: {
  initialItems: NavItem[];
  saveAction: (orderedKeys: string[]) => Promise<void>;
}) {
  const [items, setItems] = useState(initialItems);

  async function move(key: string, direction: "up" | "down") {
    const index = items.findIndex((i) => i.key === key);
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= items.length) return;

    const next = [...items];
    [next[index], next[swapWith]] = [next[swapWith], next[index]];
    setItems(next);
    await saveAction(next.map((i) => i.key));
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={item.key} className="glass flex items-center gap-3 rounded-xl px-4 py-3">
          <ReorderButtons
            onMove={(direction) => move(item.key, direction)}
            disableUp={i === 0}
            disableDown={i === items.length - 1}
          />
          <span className="flex-1">{item.label}</span>
          {item.hidden && (
            <span className="font-mono text-[10px] text-[var(--ink-muted)]">{item.hidden}</span>
          )}
        </div>
      ))}
      {items.length === 0 && (
        <p className="font-mono text-sm text-[var(--ink-muted)]">
          Todavía no hay nada visible en el navbar (activá "Mostrar en el navbar" en categorías o
          proyectos, o habilitá Sobre mí / CV).
        </p>
      )}
    </div>
  );
}
