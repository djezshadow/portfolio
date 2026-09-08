"use client";

import { useState } from "react";

type Candidate = {
  sourceType: "project" | "category" | "instagram";
  sourceId: string;
  title: string;
  description: string | null;
  date: string; // ISO
  href: string;
  hidden: boolean;
  titleOverride: string | null;
  descriptionOverride: string | null;
  featured: boolean;
};

const TYPE_LABEL: Record<Candidate["sourceType"], string> = {
  project: "Proyecto",
  category: "Categoría",
  instagram: "Instagram",
};

/**
 * Pedido: Novedades automático "pero que pueda modificarlo si algo no
 * me gusta" — lista lo que el sitio detectó solo (proyectos,
 * categorías, posts de Instagram recientes) con la opción de ocultar
 * cada uno o pisarle el título/descripción.
 */
export function AutoUpdatesPanel({
  candidates,
  saveOverrideAction,
}: {
  candidates: Candidate[];
  saveOverrideAction: (
    sourceType: "project" | "category" | "instagram",
    sourceId: string,
    formData: FormData
  ) => Promise<void>;
}) {
  const [editingKey, setEditingKey] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <p className="font-mono text-[10px] text-[var(--ink-muted)]">
        Esto se arma solo con lo último que subiste — no hace falta cargar nada acá. Si algo no te
        cierra, ocultalo o corregile el texto.
      </p>
      <ul className="space-y-2">
        {candidates.map((c) => {
          const key = `${c.sourceType}:${c.sourceId}`;
          const isEditing = editingKey === key;
          const save = saveOverrideAction.bind(null, c.sourceType, c.sourceId);

          return (
            <li key={key} className="glass space-y-2 rounded-2xl p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="shrink-0 rounded-full bg-[var(--glass-border)] px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest">
                  {TYPE_LABEL[c.sourceType]}
                </span>
                {c.featured && (
                  <span className="shrink-0 rounded-full bg-[var(--accent)] px-2 py-0.5 font-mono text-[9px] text-[var(--bg)]">
                    ★ Destacado
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className={`truncate font-display text-sm ${c.hidden ? "text-[var(--ink-muted)] line-through" : ""}`}>
                    {c.titleOverride || c.title}
                  </p>
                  <p className="truncate text-xs text-[var(--ink-muted)]">
                    {c.descriptionOverride || c.description} · {c.date.slice(0, 10)}
                  </p>
                </div>
                {c.hidden && <span className="shrink-0 font-mono text-[9px] text-red-400">OCULTO</span>}
                <button
                  type="button"
                  data-cursor="magnetic"
                  onClick={() => setEditingKey(isEditing ? null : key)}
                  className="shrink-0 rounded-full border border-[var(--glass-border)] px-3 py-1 font-mono text-[11px]"
                >
                  {isEditing ? "Cerrar" : "Corregir"}
                </button>
              </div>

              {isEditing && (
                <form
                  action={async (formData: FormData) => {
                    // OJO: antes el botón "Guardar" tenía un onClick que
                    // cerraba este panel INMEDIATAMENTE al hacer clic —
                    // eso sacaba el <form> del DOM en la misma carrera en
                    // la que el navegador todavía estaba juntando sus
                    // datos para enviarlos, y a veces el guardado se
                    // perdía en el camino ("no me deja guardar"). Ahora
                    // cerramos DESPUÉS de que save() termine, nunca antes.
                    await save(formData);
                    setEditingKey(null);
                  }}
                  className="space-y-2 rounded-lg border border-[var(--glass-border)] p-3"
                >
                  <label className="flex items-center gap-2 font-mono text-xs">
                    <input type="checkbox" name="hidden" defaultChecked={c.hidden} /> Ocultar de Novedades
                  </label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <input
                      name="titleOverride"
                      defaultValue={c.titleOverride ?? ""}
                      placeholder={`Título (ES) — default: "${c.title}"`}
                      className="rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1.5 text-sm"
                    />
                    <input
                      name="titleOverrideEn"
                      placeholder="Título (EN) — opcional"
                      className="rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <textarea
                      name="descriptionOverride"
                      defaultValue={c.descriptionOverride ?? ""}
                      rows={2}
                      placeholder={`Descripción (ES) — default: "${c.description ?? ""}"`}
                      className="rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1.5 text-sm"
                    />
                    <textarea
                      name="descriptionOverrideEn"
                      rows={2}
                      placeholder="Descripción (EN) — opcional"
                      className="rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1.5 text-sm"
                    />
                  </div>
                  <p className="font-mono text-[9px] text-[var(--ink-muted)]">
                    Dejá todo vacío y sin ocultar para volver a lo automático.
                  </p>
                  <button
                    type="submit"
                    data-cursor="magnetic"
                    className="rounded-full bg-[var(--accent)] px-4 py-1.5 font-mono text-[11px] text-[var(--bg)]"
                  >
                    Guardar
                  </button>
                </form>
              )}
            </li>
          );
        })}
        {candidates.length === 0 && (
          <li className="font-mono text-xs text-[var(--ink-muted)]">
            Todavía no hay proyectos, categorías ni posts de Instagram para mostrar acá.
          </li>
        )}
      </ul>
    </div>
  );
}
