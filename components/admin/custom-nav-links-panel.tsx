"use client";

import { useState } from "react";

type CustomLink = { id: string; label: string; labelEn: string | null; url: string };

export function CustomNavLinksPanel({
  links,
  createAction,
  deleteAction,
}: {
  links: CustomLink[];
  createAction: (formData: FormData) => Promise<void>;
  deleteAction: (id: string) => Promise<void>;
}) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="glass space-y-3 rounded-2xl p-4">
      <p className="font-mono text-xs text-[var(--ink-muted)]">
        Links propios del navbar — para lo que no es categoría, proyecto, ni ninguna sección fija
        del sitio (por ejemplo un link externo a otra web tuya).
      </p>

      {links.length > 0 && (
        <ul className="space-y-2">
          {links.map((l) => (
            <li key={l.id} className="flex items-center gap-2 rounded-lg border border-[var(--glass-border)] px-3 py-2">
              <div className="flex-1">
                <p className="font-mono text-sm">{l.label}</p>
                <p className="truncate font-mono text-[10px] text-[var(--ink-muted)]">{l.url}</p>
              </div>
              <button
                type="button"
                data-cursor="magnetic"
                onClick={() => deleteAction(l.id)}
                className="font-mono text-[11px] text-[var(--accent-contrast)] underline"
              >
                Borrar
              </button>
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <form
          action={async (formData) => {
            await createAction(formData);
            setAdding(false);
          }}
          className="flex flex-wrap gap-2"
        >
          <input name="label" required autoFocus placeholder="Nombre (ES)" className="min-w-[8rem] flex-1 rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1 text-sm" />
          <input name="labelEn" placeholder="Nombre (EN, opcional)" className="min-w-[8rem] flex-1 rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1 text-sm" />
          <input name="url" required placeholder="https://..." className="min-w-[10rem] flex-[2] rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1 text-sm" />
          <button type="submit" data-cursor="magnetic" className="shrink-0 rounded-full bg-[var(--accent)] px-3 py-1 font-mono text-[11px] text-[var(--bg)]">
            Agregar
          </button>
          <button type="button" data-cursor="magnetic" onClick={() => setAdding(false)} className="shrink-0 font-mono text-[11px] text-[var(--ink-muted)] underline">
            Cancelar
          </button>
        </form>
      ) : (
        <button type="button" data-cursor="magnetic" onClick={() => setAdding(true)} className="rounded-full border border-[var(--glass-border)] px-3 py-1 font-mono text-[11px]">
          + Nuevo link
        </button>
      )}
    </div>
  );
}
