"use client";

import { useState } from "react";

type Group = { id: string; name: string; nameEn: string | null };

export function MediaGroupsPanel({
  projectId,
  groups,
  createAction,
  renameAction,
  deleteAction,
}: {
  projectId: string;
  groups: Group[];
  createAction: (projectId: string, formData: FormData) => Promise<void>;
  renameAction: (groupId: string, formData: FormData) => Promise<void>;
  deleteAction: (groupId: string, formData: FormData) => Promise<void>;
}) {
  const [adding, setAdding] = useState(false);
  const createBound = createAction.bind(null, projectId);

  return (
    <div className="glass space-y-3 rounded-2xl p-4">
      <p className="font-mono text-xs text-[var(--ink-muted)]">
        Subcategorías (opcional) — dividí este proyecto por fecha, tipo de trabajo, etc. Después
        asignás cada foto/video a una desde el selector de abajo.
      </p>

      {groups.length > 0 && (
        <ul className="space-y-2">
          {groups.map((g) => {
            const rename = renameAction.bind(null, g.id);
            const remove = deleteAction.bind(null, g.id);
            return (
              <li key={g.id} className="flex flex-wrap items-center gap-2">
                <form action={rename} className="flex flex-1 flex-wrap gap-2">
                  <input
                    name="name"
                    defaultValue={g.name}
                    required
                    className="min-w-[8rem] flex-1 rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1 text-sm"
                  />
                  <input
                    name="nameEn"
                    defaultValue={g.nameEn ?? ""}
                    placeholder="English (opcional)"
                    className="min-w-[8rem] flex-1 rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1 text-sm"
                  />
                  <button
                    type="submit"
                    data-cursor="magnetic"
                    className="shrink-0 rounded-full bg-[var(--accent)] px-3 py-1 font-mono text-[11px] text-[var(--bg)]"
                  >
                    Renombrar
                  </button>
                </form>
                <form
                  action={remove}
                  onSubmit={(e) => {
                    if (!confirm(`¿Borrar la subcategoría "${g.name}"? Las fotos no se borran, quedan sin subcategoría.`))
                      e.preventDefault();
                  }}
                >
                  <button
                    type="submit"
                    data-cursor="magnetic"
                    className="shrink-0 font-mono text-[11px] text-[var(--accent-contrast)] underline"
                  >
                    Borrar
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}

      {adding ? (
        <form
          action={async (formData) => {
            await createBound(formData);
            setAdding(false);
          }}
          className="flex flex-wrap gap-2"
        >
          <input
            name="name"
            required
            autoFocus
            placeholder="Nombre (ej: Making of)"
            className="min-w-[8rem] flex-1 rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1 text-sm"
          />
          <input
            name="nameEn"
            placeholder="English (opcional)"
            className="min-w-[8rem] flex-1 rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1 text-sm"
          />
          <button
            type="submit"
            data-cursor="magnetic"
            className="shrink-0 rounded-full bg-[var(--accent)] px-3 py-1 font-mono text-[11px] text-[var(--bg)]"
          >
            Crear
          </button>
          <button
            type="button"
            data-cursor="magnetic"
            onClick={() => setAdding(false)}
            className="shrink-0 font-mono text-[11px] text-[var(--ink-muted)] underline"
          >
            Cancelar
          </button>
        </form>
      ) : (
        <button
          type="button"
          data-cursor="magnetic"
          onClick={() => setAdding(true)}
          className="rounded-full border border-[var(--glass-border)] px-3 py-1 font-mono text-[11px]"
        >
          + Nueva subcategoría
        </button>
      )}
    </div>
  );
}
