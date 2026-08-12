"use client";

import { useState } from "react";
import { ReorderButtons } from "./reorder-buttons";

type Group = { id: string; name: string; nameEn: string | null; coverImageUrl: string | null };
type OtherProject = { id: string; title: string };

export function MediaGroupsPanel({
  projectId,
  groups,
  otherProjects,
  createAction,
  renameAction,
  deleteAction,
  coverAction,
  moveAction,
  reorderAction,
}: {
  projectId: string;
  groups: Group[];
  otherProjects: OtherProject[];
  createAction: (projectId: string, formData: FormData) => Promise<void>;
  renameAction: (groupId: string, formData: FormData) => Promise<void>;
  deleteAction: (groupId: string, formData: FormData) => Promise<void>;
  coverAction: (groupId: string, formData: FormData) => Promise<void>;
  moveAction: (groupId: string, formData: FormData) => Promise<void>;
  reorderAction: (groupId: string, direction: "up" | "down") => Promise<void>;
}) {
  const [adding, setAdding] = useState(false);
  const createBound = createAction.bind(null, projectId);

  return (
    <div className="glass space-y-4 rounded-2xl p-4">
      <p className="font-mono text-xs text-[var(--ink-muted)]">
        Subcategorías (opcional) — dividí este proyecto por fecha, tipo de trabajo, etc. Cada una
        puede tener su propia portada, y las fotos se les asignan desde el selector de más abajo.
      </p>

      {groups.length > 0 && (
        <ul className="space-y-4">
          {groups.map((g, i) => {
            const rename = renameAction.bind(null, g.id);
            const remove = deleteAction.bind(null, g.id);
            const cover = coverAction.bind(null, g.id);
            const move = moveAction.bind(null, g.id);
            return (
              <li key={g.id} className="space-y-2 border-b border-[var(--glass-border)] pb-4">
                <div className="flex flex-wrap items-center gap-3">
                  <ReorderButtons
                    onMove={(direction) => reorderAction(g.id, direction)}
                    disableUp={i === 0}
                    disableDown={i === groups.length - 1}
                  />
                  {g.coverImageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={g.coverImageUrl} alt="" className="h-12 w-20 rounded-lg object-cover" />
                  )}
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
                </div>

                <form action={cover} className="flex flex-wrap items-center gap-2">
                  <input type="file" name="image" accept="image/*" className="font-mono text-[11px]" />
                  <button
                    type="submit"
                    data-cursor="magnetic"
                    className="rounded-full border border-[var(--glass-border)] px-3 py-1 font-mono text-[10px]"
                  >
                    {g.coverImageUrl ? "Reemplazar portada" : "Subir portada (1600×900)"}
                  </button>
                  {g.coverImageUrl && (
                    <label className="flex items-center gap-1.5 font-mono text-[10px] text-[var(--ink-muted)]">
                      <input type="checkbox" name="removeImage" /> Quitar (usa la 1ª foto del grupo)
                    </label>
                  )}
                </form>

                <div className="flex flex-wrap items-center gap-2">
                  {otherProjects.length > 0 && (
                    <form action={move} className="flex items-center gap-2">
                      <select
                        name="targetProjectId"
                        required
                        defaultValue=""
                        className="rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1 font-mono text-[11px]"
                      >
                        <option value="" disabled>
                          Mover a otro proyecto…
                        </option>
                        {otherProjects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        data-cursor="magnetic"
                        onClick={(e) => {
                          if (!confirm(`¿Mover "${g.name}" y todas sus fotos a otro proyecto?`)) {
                            e.preventDefault();
                          }
                        }}
                        className="rounded-full border border-[var(--glass-border)] px-3 py-1 font-mono text-[10px]"
                      >
                        Mover
                      </button>
                    </form>
                  )}
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
                      className="font-mono text-[11px] text-[var(--accent-contrast)] underline"
                    >
                      Borrar subcategoría
                    </button>
                  </form>
                </div>
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
