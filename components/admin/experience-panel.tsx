"use client";

import { useState } from "react";

type Experience = {
  id: string;
  role: string;
  roleEn: string | null;
  company: string | null;
  description: string | null;
  descriptionEn: string | null;
  dateStart: Date | string | null;
  dateEnd: Date | string | null;
  isOngoing: boolean;
};

function toInputDate(d: Date | string | null) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function ExperiencePanel({
  experiences,
  createAction,
  updateAction,
  deleteAction,
}: {
  experiences: Experience[];
  createAction: (formData: FormData) => Promise<void>;
  updateAction: (experienceId: string, formData: FormData) => Promise<void>;
  deleteAction: (experienceId: string, formData: FormData) => Promise<void>;
}) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="glass space-y-4 rounded-2xl p-4">
      <p className="font-mono text-xs text-[var(--ink-muted)]">
        Experiencia laboral cargada a mano — además de esto, el CV suma automáticamente los
        proyectos de tu portfolio con sus fechas.
      </p>

      <ul className="space-y-3">
        {experiences.map((exp) => {
          const update = updateAction.bind(null, exp.id);
          const remove = deleteAction.bind(null, exp.id);
          return (
            <li key={exp.id} className="space-y-2 border-b border-[var(--glass-border)] pb-3">
              <form action={update} className="grid grid-cols-2 gap-2">
                <input name="role" defaultValue={exp.role} required placeholder="Puesto/rol" className="rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1 text-sm" />
                <input name="roleEn" defaultValue={exp.roleEn ?? ""} placeholder="Rol en inglés (opcional)" className="rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1 text-sm" />
                <input name="company" defaultValue={exp.company ?? ""} placeholder="Empresa/cliente (opcional)" className="col-span-2 rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1 text-sm" />
                <textarea name="description" defaultValue={exp.description ?? ""} placeholder="Descripción breve (opcional)" rows={2} className="col-span-2 rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1 text-sm" />
                <textarea name="descriptionEn" defaultValue={exp.descriptionEn ?? ""} placeholder="Descripción en inglés (opcional)" rows={2} className="col-span-2 rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1 text-sm" />
                <label className="font-mono text-[10px] text-[var(--ink-muted)]">
                  Desde
                  <input type="date" name="dateStart" defaultValue={toInputDate(exp.dateStart)} className="mt-1 w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1 text-sm" />
                </label>
                <label className="font-mono text-[10px] text-[var(--ink-muted)]">
                  Hasta
                  <input type="date" name="dateEnd" defaultValue={toInputDate(exp.dateEnd)} className="mt-1 w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1 text-sm" />
                </label>
                <label className="col-span-2 flex items-center gap-2 font-mono text-[11px] text-[var(--ink-muted)]">
                  <input type="checkbox" name="isOngoing" defaultChecked={exp.isOngoing} /> Sigo en este puesto
                </label>
                <button type="submit" data-cursor="magnetic" className="col-span-2 rounded-full bg-[var(--accent)] py-1 font-mono text-[11px] text-[var(--bg)]">
                  Guardar
                </button>
              </form>
              <form action={remove} onSubmit={(e) => { if (!confirm(`¿Borrar "${exp.role}"?`)) e.preventDefault(); }}>
                <button type="submit" data-cursor="magnetic" className="font-mono text-[11px] text-[var(--accent-contrast)] underline">
                  Borrar experiencia
                </button>
              </form>
            </li>
          );
        })}
      </ul>

      {adding ? (
        <form
          action={async (formData) => {
            await createAction(formData);
            setAdding(false);
          }}
          className="grid grid-cols-2 gap-2"
        >
          <input name="role" required autoFocus placeholder="Puesto/rol" className="rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1 text-sm" />
          <input name="roleEn" placeholder="Rol en inglés (opcional)" className="rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1 text-sm" />
          <input name="company" placeholder="Empresa/cliente (opcional)" className="col-span-2 rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1 text-sm" />
          <textarea name="description" placeholder="Descripción breve (opcional)" rows={2} className="col-span-2 rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1 text-sm" />
          <textarea name="descriptionEn" placeholder="Descripción en inglés (opcional)" rows={2} className="col-span-2 rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1 text-sm" />
          <label className="font-mono text-[10px] text-[var(--ink-muted)]">
            Desde
            <input type="date" name="dateStart" className="mt-1 w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1 text-sm" />
          </label>
          <label className="font-mono text-[10px] text-[var(--ink-muted)]">
            Hasta
            <input type="date" name="dateEnd" className="mt-1 w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1 text-sm" />
          </label>
          <label className="col-span-2 flex items-center gap-2 font-mono text-[11px] text-[var(--ink-muted)]">
            <input type="checkbox" name="isOngoing" /> Sigo en este puesto
          </label>
          <button type="submit" data-cursor="magnetic" className="rounded-full bg-[var(--accent)] py-1 font-mono text-[11px] text-[var(--bg)]">
            Agregar
          </button>
          <button type="button" data-cursor="magnetic" onClick={() => setAdding(false)} className="font-mono text-[11px] text-[var(--ink-muted)] underline">
            Cancelar
          </button>
        </form>
      ) : (
        <button type="button" data-cursor="magnetic" onClick={() => setAdding(true)} className="rounded-full border border-[var(--glass-border)] px-3 py-1 font-mono text-[11px]">
          + Nueva experiencia
        </button>
      )}
    </div>
  );
}
