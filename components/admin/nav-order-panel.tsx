"use client";

import { useState } from "react";
import { ReorderButtons } from "@/components/admin/reorder-buttons";

type NavItem = {
  key: string;
  label: string;
  type: string;
  enabled: boolean;
  toggleAction: (() => Promise<void>) | null;
};

export function NavOrderPanel({
  initialItems,
  saveAction,
}: {
  initialItems: NavItem[];
  saveAction: (orderedKeys: string[]) => Promise<void>;
}) {
  const [items, setItems] = useState(initialItems);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  async function move(key: string, direction: "up" | "down") {
    const index = items.findIndex((i) => i.key === key);
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= items.length) return;

    const next = [...items];
    [next[index], next[swapWith]] = [next[swapWith], next[index]];
    setItems(next);
    await saveAction(next.map((i) => i.key));
  }

  async function toggle(item: NavItem) {
    if (!item.toggleAction) return;
    setBusyKey(item.key);
    try {
      await item.toggleAction();
      setItems((prev) => prev.map((i) => (i.key === item.key ? { ...i, enabled: !i.enabled } : i)));
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div
          key={item.key}
          className={`glass flex items-center gap-3 rounded-xl px-4 py-3 ${!item.enabled ? "opacity-50" : ""}`}
        >
          <ReorderButtons
            onMove={(direction) => move(item.key, direction)}
            disableUp={i === 0}
            disableDown={i === items.length - 1}
          />
          <span className="flex-1">{item.label}</span>
          {item.type !== "fixed" && (
            <span className="font-mono text-[10px] text-[var(--ink-muted)]">{item.type}</span>
          )}
          {item.toggleAction ? (
            <button
              type="button"
              data-cursor="magnetic"
              disabled={busyKey === item.key}
              onClick={() => toggle(item)}
              aria-label={item.enabled ? "Ocultar del navbar" : "Mostrar en el navbar"}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/10 text-sm disabled:opacity-40"
            >
              {item.enabled ? "👁️" : "🚫"}
            </button>
          ) : (
            <span className="flex h-8 w-8 items-center justify-center text-sm opacity-40" title="Siempre visible">
              👁️
            </span>
          )}
        </div>
      ))}
      {items.length === 0 && (
        <p className="font-mono text-sm text-[var(--ink-muted)]">Todavía no hay nada para ordenar.</p>
      )}
    </div>
  );
}
