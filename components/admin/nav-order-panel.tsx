"use client";

import { useState } from "react";
import { ReorderButtons } from "@/components/admin/reorder-buttons";

type NavItem = {
  key: string;
  label: string;
  type: string;
  enabled: boolean;
  toggleAction: (() => Promise<void>) | null;
  /// Solo los ítems fijos (home/about/colaboradores/contacto/cv) se
  /// pueden renombrar acá — categorías/proyectos ya tienen su nombre
  /// editable en su propia sección de admin.
  renameable?: boolean;
  currentEs?: string;
  currentEn?: string;
};

export function NavOrderPanel({
  initialItems,
  saveAction,
  renameAction,
}: {
  initialItems: NavItem[];
  saveAction: (orderedKeys: string[]) => Promise<void>;
  renameAction: (key: string, es: string, en: string) => Promise<void>;
}) {
  const [items, setItems] = useState(initialItems);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [renamingKey, setRenamingKey] = useState<string | null>(null);

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

  async function rename(item: NavItem, es: string, en: string) {
    await renameAction(item.key, es, en);
    setItems((prev) => prev.map((i) => (i.key === item.key ? { ...i, label: es || i.label } : i)));
    setRenamingKey(null);
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div
          key={item.key}
          className={`glass rounded-xl px-4 py-3 ${!item.enabled ? "opacity-50" : ""}`}
        >
          <div className="flex items-center gap-3">
            <ReorderButtons
              onMove={(direction) => move(item.key, direction)}
              disableUp={i === 0}
              disableDown={i === items.length - 1}
            />
            <span className="flex-1">{item.label}</span>
            {item.type !== "fixed" && (
              <span className="font-mono text-[10px] text-[var(--ink-muted)]">{item.type}</span>
            )}
            {item.renameable && (
              <button
                type="button"
                data-cursor="magnetic"
                onClick={() => setRenamingKey(renamingKey === item.key ? null : item.key)}
                aria-label="Renombrar"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-black/10 text-xs"
              >
                ✏️
              </button>
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

          {item.renameable && renamingKey === item.key && (
            <form
              action={(formData) => {
                rename(item, String(formData.get("es") ?? ""), String(formData.get("en") ?? ""));
              }}
              className="mt-2 flex flex-wrap gap-2 border-t border-[var(--glass-border)] pt-2"
            >
              <input
                name="es"
                defaultValue={item.currentEs}
                placeholder="Nombre en español"
                className="min-w-[8rem] flex-1 rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1 text-sm"
              />
              <input
                name="en"
                defaultValue={item.currentEn}
                placeholder="Nombre en inglés"
                className="min-w-[8rem] flex-1 rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1 text-sm"
              />
              <button type="submit" data-cursor="magnetic" className="rounded-full bg-[var(--accent)] px-3 py-1 font-mono text-[11px] text-[var(--bg)]">
                Guardar
              </button>
            </form>
          )}
        </div>
      ))}
      {items.length === 0 && (
        <p className="font-mono text-sm text-[var(--ink-muted)]">Todavía no hay nada para ordenar.</p>
      )}
    </div>
  );
}
