"use client";

import { useState } from "react";

type Skill = { id: string; name: string; nameEn: string | null };

export function SkillsPanel({
  skills,
  createAction,
  deleteAction,
}: {
  skills: Skill[];
  createAction: (formData: FormData) => Promise<void>;
  deleteAction: (skillId: string, formData: FormData) => Promise<void>;
}) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="glass space-y-3 rounded-2xl p-4">
      <p className="font-mono text-xs text-[var(--ink-muted)]">
        Aptitudes/skills que van a aparecer listadas en el CV.
      </p>

      {skills.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {skills.map((s) => {
            const remove = deleteAction.bind(null, s.id);
            return (
              <li key={s.id}>
                <form action={remove} className="flex items-center gap-1.5 rounded-full border border-[var(--glass-border)] px-3 py-1">
                  <span className="font-mono text-xs">{s.name}</span>
                  <button type="submit" data-cursor="magnetic" aria-label={`Borrar ${s.name}`} className="text-[var(--accent-contrast)]">
                    ×
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
            await createAction(formData);
            setAdding(false);
          }}
          className="flex flex-wrap gap-2"
        >
          <input
            name="name"
            required
            autoFocus
            placeholder="Nombre (ej: Edición en DaVinci Resolve)"
            className="min-w-[10rem] flex-1 rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1 text-sm"
          />
          <input
            name="nameEn"
            placeholder="English (opcional)"
            className="min-w-[8rem] flex-1 rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1 text-sm"
          />
          <button type="submit" data-cursor="magnetic" className="shrink-0 rounded-full bg-[var(--accent)] px-3 py-1 font-mono text-[11px] text-[var(--bg)]">
            Agregar
          </button>
          <button type="button" data-cursor="magnetic" onClick={() => setAdding(false)} className="shrink-0 font-mono text-[11px] text-[var(--ink-muted)] underline">
            Cancelar
          </button>
        </form>
      ) : (
        <button type="button" data-cursor="magnetic" onClick={() => setAdding(true)} className="rounded-full border border-[var(--glass-border)] px-3 py-1 font-mono text-[11px]">
          + Nueva aptitud
        </button>
      )}
    </div>
  );
}
