"use client";

import { useState } from "react";

type TypeOption = { id: string; name: string; nameEn: string | null; isClient: boolean };

export function CollaboratorTypesPanel({
  types,
  createAction,
  renameAction,
  deleteAction,
}: {
  types: TypeOption[];
  createAction: (formData: FormData) => Promise<void>;
  renameAction: (typeId: string, formData: FormData) => Promise<void>;
  deleteAction: (typeId: string, formData: FormData) => Promise<void>;
}) {
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="glass space-y-4 rounded-2xl p-5">
      <p className="font-mono text-xs text-[var(--ink-muted)]">
        "Es Cliente" decide si aparece en la sección Clientes o en Colaboradores de la vista
        pública (item #8). Un tipo en uso no se puede borrar — primero reasigná esos
        colaboradores a otro tipo.
      </p>

      {error && <p className="font-mono text-xs text-red-400">{error}</p>}

      <ul className="space-y-2">
        {types.map((t) => {
          const rename = renameAction.bind(null, t.id);
          const remove = deleteAction.bind(null, t.id);
          return (
            <li key={t.id} className="flex flex-wrap items-center gap-2 border-b border-[var(--glass-border)] pb-2">
              <form action={rename} className="flex flex-1 flex-wrap items-center gap-2">
                <input
                  name="name"
                  defaultValue={t.name}
                  required
                  className="min-w-[8rem] flex-1 rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1 text-sm"
                />
                <input
                  name="nameEn"
                  defaultValue={t.nameEn ?? ""}
                  placeholder="English (opcional)"
                  className="min-w-[8rem] flex-1 rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1 text-sm"
                />
                <label className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--ink-muted)]">
                  <input type="checkbox" name="isClient" defaultChecked={t.isClient} /> Es Cliente
                </label>
                <button
                  type="submit"
                  data-cursor="magnetic"
                  className="shrink-0 rounded-full bg-[var(--accent)] px-3 py-1 font-mono text-[11px] text-[var(--bg)]"
                >
                  Guardar
                </button>
              </form>
              <form
                action={async (formData) => {
                  setError(null);
                  try {
                    await remove(formData);
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "No se pudo borrar.");
                  }
                }}
                onSubmit={(e) => {
                  if (!confirm(`¿Borrar el tipo "${t.name}"?`)) e.preventDefault();
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

      {adding ? (
        <form
          action={async (formData) => {
            setError(null);
            try {
              await createAction(formData);
              setAdding(false);
            } catch (e) {
              setError(e instanceof Error ? e.message : "No se pudo crear.");
            }
          }}
          className="flex flex-wrap items-center gap-2"
        >
          <input
            name="name"
            required
            autoFocus
            placeholder="Nombre (ej: Sponsor)"
            className="min-w-[8rem] flex-1 rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1 text-sm"
          />
          <input
            name="nameEn"
            placeholder="English (opcional)"
            className="min-w-[8rem] flex-1 rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1 text-sm"
          />
          <label className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--ink-muted)]">
            <input type="checkbox" name="isClient" /> Es Cliente
          </label>
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
          + Nuevo tipo
        </button>
      )}
    </div>
  );
}
