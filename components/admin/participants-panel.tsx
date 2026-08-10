"use client";

import { useState } from "react";

type Participant = {
  id: string;
  name: string | null;
  role: string | null;
  roleEn: string | null;
  instagram: string | null;
  website: string | null;
};

export function ParticipantsPanel({
  collaboratorId,
  participants,
  createAction,
  updateAction,
  deleteAction,
}: {
  collaboratorId: string;
  participants: Participant[];
  createAction: (collaboratorId: string, formData: FormData) => Promise<void>;
  updateAction: (participantId: string, formData: FormData) => Promise<void>;
  deleteAction: (participantId: string, formData: FormData) => Promise<void>;
}) {
  const [adding, setAdding] = useState(false);
  const createBound = createAction.bind(null, collaboratorId);

  return (
    <div className="glass space-y-4 rounded-2xl p-4">
      <p className="font-mono text-xs text-[var(--ink-muted)]">
        Personas puntuales dentro de este colaborador (ej: director, DP). Todo opcional.
      </p>

      <ul className="space-y-3">
        {participants.map((p) => {
          const update = updateAction.bind(null, p.id);
          const remove = deleteAction.bind(null, p.id);
          return (
            <li key={p.id} className="space-y-2 border-b border-[var(--glass-border)] pb-3">
              <form action={update} className="grid grid-cols-2 gap-2">
                <input
                  name="name"
                  defaultValue={p.name ?? ""}
                  placeholder="Nombre"
                  className="rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1 text-sm"
                />
                <input
                  name="role"
                  defaultValue={p.role ?? ""}
                  placeholder="Rol (ej: Director)"
                  className="rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1 text-sm"
                />
                <input
                  name="roleEn"
                  defaultValue={p.roleEn ?? ""}
                  placeholder="Rol en inglés (opcional)"
                  className="rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1 text-sm"
                />
                <input
                  name="instagram"
                  defaultValue={p.instagram ?? ""}
                  placeholder="Instagram (URL)"
                  className="rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1 text-sm"
                />
                <input
                  name="website"
                  defaultValue={p.website ?? ""}
                  placeholder="Website"
                  className="col-span-2 rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1 text-sm"
                />
                <button
                  type="submit"
                  data-cursor="magnetic"
                  className="col-span-2 rounded-full bg-[var(--accent)] py-1 font-mono text-[11px] text-[var(--bg)]"
                >
                  Guardar
                </button>
              </form>
              <form
                action={remove}
                onSubmit={(e) => {
                  if (!confirm(`¿Borrar a "${p.name ?? "este participante"}"?`)) e.preventDefault();
                }}
              >
                <button
                  type="submit"
                  data-cursor="magnetic"
                  className="font-mono text-[11px] text-[var(--accent-contrast)] underline"
                >
                  Borrar participante
                </button>
              </form>
            </li>
          );
        })}
      </ul>

      {adding ? (
        <form
          action={async (formData) => {
            await createBound(formData);
            setAdding(false);
          }}
          className="grid grid-cols-2 gap-2"
        >
          <input
            name="name"
            autoFocus
            placeholder="Nombre"
            className="rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1 text-sm"
          />
          <input
            name="role"
            placeholder="Rol (ej: Director)"
            className="rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1 text-sm"
          />
          <input
            name="roleEn"
            placeholder="Rol en inglés (opcional)"
            className="rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1 text-sm"
          />
          <input
            name="instagram"
            placeholder="Instagram (URL)"
            className="rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1 text-sm"
          />
          <input
            name="website"
            placeholder="Website"
            className="col-span-2 rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1 text-sm"
          />
          <button
            type="submit"
            data-cursor="magnetic"
            className="rounded-full bg-[var(--accent)] py-1 font-mono text-[11px] text-[var(--bg)]"
          >
            Agregar
          </button>
          <button
            type="button"
            data-cursor="magnetic"
            onClick={() => setAdding(false)}
            className="font-mono text-[11px] text-[var(--ink-muted)] underline"
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
          + Nuevo participante
        </button>
      )}
    </div>
  );
}
