"use client";

import { useState } from "react";

const LABELS: Record<string, string> = {
  novedades: "Novedades (carrusel)",
  hero: "Hero (título principal)",
  categorias: "Categorías (carrusel)",
  colaboradores: "Con quién trabajé",
  instagram: "Instagram",
};

/**
 * Pedido: reordenar las secciones del home arrastrando — incluye
 * Novedades, que ya no queda fija arriba (a pedido explícito).
 */
export function HomeSectionOrderPanel({
  order,
  saveAction,
}: {
  order: string[];
  saveAction: (orderedKeys: string[]) => Promise<void>;
}) {
  const [items, setItems] = useState(order);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);

  function handleDrop(targetKey: string) {
    if (!dragKey || dragKey === targetKey) {
      setDragKey(null);
      setOverKey(null);
      return;
    }
    const fromIndex = items.findIndex((k) => k === dragKey);
    const toIndex = items.findIndex((k) => k === targetKey);
    setDragKey(null);
    setOverKey(null);
    if (fromIndex === -1 || toIndex === -1) return;

    const next = [...items];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setItems(next);
    void saveAction(next);
  }

  function move(key: string, direction: "up" | "down") {
    const idx = items.findIndex((k) => k === key);
    const swapWith = direction === "up" ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= items.length) return;
    const next = [...items];
    [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
    setItems(next);
    void saveAction(next);
  }

  return (
    <div className="glass space-y-2 rounded-2xl p-4">
      <p className="mb-2 font-mono text-[10px] text-[var(--ink-muted)]">
        Novedades queda siempre arriba de todo. Arrastrá para reordenar el resto (en celular o con
        teclado, usá las flechitas).
      </p>
      <ul className="space-y-2">
        {items.map((key, i) => (
          <li
            key={key}
            draggable
            onDragStart={() => setDragKey(key)}
            onDragOver={(e) => {
              e.preventDefault();
              if (overKey !== key) setOverKey(key);
            }}
            onDragLeave={() => setOverKey((cur) => (cur === key ? null : cur))}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(key);
            }}
            onDragEnd={() => {
              setDragKey(null);
              setOverKey(null);
            }}
            className={`flex items-center gap-3 rounded-xl border border-[var(--glass-border)] px-3 py-2 transition-opacity cursor-grab active:cursor-grabbing ${
              dragKey === key ? "opacity-40" : ""
            } ${overKey === key && dragKey && dragKey !== key ? "ring-2 ring-[var(--accent)]" : ""}`}
          >
            <div className="flex shrink-0 flex-col">
              <button
                type="button"
                disabled={i === 0}
                onClick={() => move(key, "up")}
                data-cursor="magnetic"
                className="px-1 text-xs disabled:opacity-20"
                aria-label="Subir"
              >
                ↑
              </button>
              <button
                type="button"
                disabled={i === items.length - 1}
                onClick={() => move(key, "down")}
                data-cursor="magnetic"
                className="px-1 text-xs disabled:opacity-20"
                aria-label="Bajar"
              >
                ↓
              </button>
            </div>
            <span className="font-mono text-xs text-[var(--ink-muted)]">#{i + 1}</span>
            <span className="font-display text-sm">{LABELS[key] ?? key}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
