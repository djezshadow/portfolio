"use client";

import { useState, useTransition } from "react";

type Entry = {
  id: string;
  title: string;
  titleEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  date: string; // ISO — llega serializado desde el Server Component
};

function toDateInputValue(iso: string) {
  return iso.slice(0, 10);
}

export function UpdatesPanel({
  entries,
  addAction,
  editAction,
  deleteAction,
  moveAction,
  reorderAction,
}: {
  entries: Entry[];
  addAction: (formData: FormData) => Promise<{ ok: boolean; error?: string }>;
  editAction: (entryId: string, formData: FormData) => Promise<{ ok: boolean; error?: string }>;
  deleteAction: (entryId: string, formData: FormData) => Promise<void>;
  moveAction: (entryId: string, direction: "up" | "down") => Promise<void>;
  reorderAction: (orderedIds: string[]) => Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const fromIndex = entries.findIndex((e) => e.id === dragId);
    const toIndex = entries.findIndex((e) => e.id === targetId);
    setDragId(null);
    setOverId(null);
    if (fromIndex === -1 || toIndex === -1) return;

    const next = [...entries];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    void reorderAction(next.map((e) => e.id));
  }

  return (
    <div className="space-y-4">
      {error && <p className="font-mono text-xs text-red-400">{error}</p>}

      {entries.length > 1 && (
        <p className="font-mono text-[9px] text-[var(--ink-muted)]">
          Arrastrá una novedad para reordenarla (en celular o con teclado, usá las flechitas).
        </p>
      )}

      <ul className="space-y-2">
        {entries.map((entry, i) => {
          const remove = deleteAction.bind(null, entry.id);
          const isEditing = editingId === entry.id;

          return (
            <li
              key={entry.id}
              draggable={!isEditing}
              onDragStart={() => setDragId(entry.id)}
              onDragOver={(e) => {
                e.preventDefault();
                if (overId !== entry.id) setOverId(entry.id);
              }}
              onDragLeave={() => setOverId((cur) => (cur === entry.id ? null : cur))}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(entry.id);
              }}
              onDragEnd={() => {
                setDragId(null);
                setOverId(null);
              }}
              className={`glass space-y-2 rounded-2xl p-4 transition-opacity ${
                isEditing ? "" : "cursor-grab active:cursor-grabbing"
              } ${dragId === entry.id ? "opacity-40" : ""} ${
                overId === entry.id && dragId && dragId !== entry.id ? "ring-2 ring-[var(--accent)]" : ""
              }`}
            >
              <div className="flex flex-wrap items-start gap-2">
                <div className="flex shrink-0 flex-col">
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => startTransition(() => moveAction(entry.id, "up"))}
                    data-cursor="magnetic"
                    className="px-1 text-xs disabled:opacity-20"
                    aria-label="Subir"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={i === entries.length - 1}
                    onClick={() => startTransition(() => moveAction(entry.id, "down"))}
                    data-cursor="magnetic"
                    className="px-1 text-xs disabled:opacity-20"
                    aria-label="Bajar"
                  >
                    ↓
                  </button>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[10px] text-[var(--ink-muted)]">{toDateInputValue(entry.date)}</p>
                  <p className="font-display text-sm">{entry.title}</p>
                  {entry.description && <p className="text-xs text-[var(--ink-muted)]">{entry.description}</p>}
                </div>
                <button
                  type="button"
                  data-cursor="magnetic"
                  onClick={() => setEditingId(isEditing ? null : entry.id)}
                  className="shrink-0 rounded-full border border-[var(--glass-border)] px-3 py-1 font-mono text-[11px]"
                >
                  {isEditing ? "Cerrar" : "Editar"}
                </button>
                <form action={remove}>
                  <button
                    type="submit"
                    data-cursor="magnetic"
                    className="shrink-0 rounded-full border border-red-400/40 px-3 py-1 font-mono text-[11px] text-red-400"
                  >
                    Borrar
                  </button>
                </form>
              </div>

              {isEditing && (
                <form
                  action={async (formData: FormData) => {
                    setError(null);
                    const result = await editAction(entry.id, formData);
                    if (!result.ok) setError(result.error ?? "No se pudo guardar.");
                    else setEditingId(null);
                  }}
                  className="ml-8 space-y-2 rounded-lg border border-[var(--glass-border)] p-3"
                >
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <input
                      name="title"
                      defaultValue={entry.title}
                      required
                      placeholder="Título (ES)"
                      className="rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1.5 text-sm"
                    />
                    <input
                      name="titleEn"
                      defaultValue={entry.titleEn ?? ""}
                      placeholder="Título (EN) — opcional"
                      className="rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <textarea
                      name="description"
                      defaultValue={entry.description ?? ""}
                      rows={2}
                      placeholder="Descripción (ES) — opcional"
                      className="rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1.5 text-sm"
                    />
                    <textarea
                      name="descriptionEn"
                      defaultValue={entry.descriptionEn ?? ""}
                      rows={2}
                      placeholder="Descripción (EN) — opcional"
                      className="rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="font-mono text-[11px] text-[var(--ink-muted)]">
                      Fecha:
                      <input
                        type="date"
                        name="date"
                        defaultValue={toDateInputValue(entry.date)}
                        className="ml-2 rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1 text-sm"
                      />
                    </label>
                    <button
                      type="submit"
                      data-cursor="magnetic"
                      className="rounded-full bg-[var(--accent)] px-4 py-1.5 font-mono text-[11px] text-[var(--bg)]"
                    >
                      Guardar cambios
                    </button>
                  </div>
                </form>
              )}
            </li>
          );
        })}
        {entries.length === 0 && (
          <li className="font-mono text-xs text-[var(--ink-muted)]">Todavía no hay novedades cargadas.</li>
        )}
      </ul>

      <form
        action={async (formData: FormData) => {
          setError(null);
          const result = await addAction(formData);
          if (!result.ok) setError(result.error ?? "No se pudo agregar.");
        }}
        className="glass space-y-2 rounded-2xl p-4"
      >
        <p className="font-mono text-xs uppercase tracking-widest text-[var(--ink-muted)]">Agregar novedad</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            name="title"
            required
            placeholder="Título (ES)"
            className="rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1.5 text-sm"
          />
          <input
            name="titleEn"
            placeholder="Título (EN) — opcional"
            className="rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1.5 text-sm"
          />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <textarea
            name="description"
            rows={2}
            placeholder="Descripción (ES) — opcional"
            className="rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1.5 text-sm"
          />
          <textarea
            name="descriptionEn"
            rows={2}
            placeholder="Descripción (EN) — opcional"
            className="rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="font-mono text-[11px] text-[var(--ink-muted)]">
            Fecha:
            <input
              type="date"
              name="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="ml-2 rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1 text-sm"
            />
          </label>
          <button
            type="submit"
            data-cursor="magnetic"
            className="rounded-full bg-[var(--accent)] px-4 py-1.5 font-mono text-[11px] text-[var(--bg)]"
          >
            + Agregar
          </button>
        </div>
      </form>
    </div>
  );
}
