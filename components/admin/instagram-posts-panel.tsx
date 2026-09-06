"use client";

import { useState, useTransition } from "react";
import { compressImageForUpload } from "@/lib/compress-image";

type Post = {
  id: string;
  url: string;
  title: string | null;
  caption: string | null;
  section: string;
  coverImageUrl: string | null;
};

const RING_GRADIENT = "linear-gradient(45deg, #feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5)";

export function InstagramPostsPanel({
  posts,
  addAction,
  editAction,
  deleteAction,
  moveAction,
  reorderAction,
}: {
  posts: Post[];
  addAction: (formData: FormData) => Promise<{ ok: boolean; error?: string }>;
  editAction: (postId: string, formData: FormData) => Promise<{ ok: boolean; error?: string }>;
  deleteAction: (postId: string, formData: FormData) => Promise<void>;
  moveAction: (postId: string, direction: "up" | "down") => Promise<void>;
  reorderAction: (orderedIds: string[]) => Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleDrop(sectionList: Post[], targetId: string) {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const fromIndex = sectionList.findIndex((p) => p.id === dragId);
    const toIndex = sectionList.findIndex((p) => p.id === targetId);
    setDragId(null);
    setOverId(null);
    if (fromIndex === -1 || toIndex === -1) return;

    const next = [...sectionList];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    void reorderAction(next.map((p) => p.id));
  }

  function renderSection(section: "feed" | "highlight", label: string) {
    const list = posts.filter((p) => p.section === section);
    const isHighlight = section === "highlight";

    return (
      <div className="glass space-y-3 rounded-2xl p-5">
        <p className="font-mono text-xs uppercase tracking-widest text-[var(--ink-muted)]">{label}</p>
        {isHighlight && (
          <p className="font-mono text-[10px] text-[var(--ink-muted)]">
            Instagram no deja mostrar Historias Destacadas embebidas fuera de la app — por eso acá se
            arma un círculo con degradé (igual al de tu perfil) con la foto que subas, y al tocarlo
            lleva directo a la destacada real en Instagram. Portada ideal: cuadrada, mínimo 400×400px
            — se recorta a círculo, así que el asunto principal de la foto conviene que esté
            centrado.
          </p>
        )}
        {list.length > 1 && (
          <p className="font-mono text-[9px] text-[var(--ink-muted)]">
            Arrastrá un post para reordenarlo (en celular o con teclado, usá las flechitas).
          </p>
        )}

        <ul className="space-y-2">
          {list.map((p, i) => {
            const remove = deleteAction.bind(null, p.id);
            const isEditing = editingId === p.id;

            return (
              <li
                key={p.id}
                draggable={!isEditing}
                onDragStart={() => setDragId(p.id)}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (overId !== p.id) setOverId(p.id);
                }}
                onDragLeave={() => setOverId((cur) => (cur === p.id ? null : cur))}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDrop(list, p.id);
                }}
                onDragEnd={() => {
                  setDragId(null);
                  setOverId(null);
                }}
                className={`space-y-2 rounded-xl border-b border-[var(--glass-border)] pb-2 transition-opacity ${
                  isEditing ? "" : "cursor-grab active:cursor-grabbing"
                } ${dragId === p.id ? "opacity-40" : ""} ${
                  overId === p.id && dragId && dragId !== p.id ? "ring-2 ring-[var(--accent)]" : ""
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex shrink-0 flex-col">
                    <button
                      type="button"
                      disabled={i === 0}
                      onClick={() => startTransition(() => moveAction(p.id, "up"))}
                      data-cursor="magnetic"
                      className="px-1 text-xs disabled:opacity-20"
                      aria-label="Subir"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={i === list.length - 1}
                      onClick={() => startTransition(() => moveAction(p.id, "down"))}
                      data-cursor="magnetic"
                      className="px-1 text-xs disabled:opacity-20"
                      aria-label="Bajar"
                    >
                      ↓
                    </button>
                  </div>
                  {p.coverImageUrl && (
                    <span className="shrink-0 rounded-full p-[2px]" style={{ background: RING_GRADIENT }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.coverImageUrl}
                        alt=""
                        className="h-10 w-10 rounded-full border-2 border-[var(--bg)] object-cover"
                      />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-xs font-semibold">{p.title || "(sin título)"}</p>
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate font-mono text-[10px] text-accent"
                    >
                      {p.url}
                    </a>
                    {p.caption && <p className="truncate text-xs text-[var(--ink-muted)]">{p.caption}</p>}
                  </div>
                  <button
                    type="button"
                    data-cursor="magnetic"
                    onClick={() => setEditingId(isEditing ? null : p.id)}
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
                      const file = formData.get("image") as File | null;
                      if (file && file.size > 0) {
                        const compressed = await compressImageForUpload(file, { maxWidth: 400, maxHeight: 400 });
                        formData.set("image", compressed);
                      }
                      const result = await editAction(p.id, formData);
                      if (!result.ok) setError(result.error ?? "No se pudo guardar.");
                      else setEditingId(null);
                    }}
                    className="ml-8 flex flex-wrap gap-2 rounded-lg border border-[var(--glass-border)] p-2"
                  >
                    <input
                      name="title"
                      defaultValue={p.title ?? ""}
                      placeholder="Título (solo para vos, en el admin)"
                      className="min-w-[12rem] flex-1 rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1.5 text-sm"
                    />
                    <input
                      name="url"
                      defaultValue={p.url}
                      required
                      className="min-w-[16rem] flex-1 rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1.5 text-sm"
                    />
                    <input
                      name="caption"
                      defaultValue={p.caption ?? ""}
                      placeholder="Descripción corta (opcional)"
                      className="min-w-[10rem] flex-1 rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1.5 text-sm"
                    />
                    {isHighlight && (
                      <label className="flex items-center gap-2 font-mono text-[11px] text-[var(--ink-muted)]">
                        Reemplazar portada:
                        <input type="file" name="image" accept="image/*" className="text-xs" />
                      </label>
                    )}
                    <button
                      type="submit"
                      data-cursor="magnetic"
                      className="shrink-0 rounded-full bg-[var(--accent)] px-4 py-1.5 font-mono text-[11px] text-[var(--bg)]"
                    >
                      Guardar cambios
                    </button>
                  </form>
                )}
              </li>
            );
          })}
          {list.length === 0 && (
            <li className="font-mono text-xs text-[var(--ink-muted)]">Todavía no hay {isHighlight ? "destacadas" : "posts"} acá.</li>
          )}
        </ul>

        <form
          action={async (formData: FormData) => {
            setError(null);
            const file = formData.get("image") as File | null;
            if (file && file.size > 0) {
              const compressed = await compressImageForUpload(file, { maxWidth: 400, maxHeight: 400 });
              formData.set("image", compressed);
            }
            const result = await addAction(formData);
            if (!result.ok) setError(result.error ?? "No se pudo agregar.");
          }}
          className="flex flex-wrap gap-2"
        >
          <input type="hidden" name="section" value={section} />
          <input
            name="title"
            placeholder="Título (solo para vos)"
            className="min-w-[10rem] flex-1 rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1.5 text-sm"
          />
          <input
            name="url"
            required
            placeholder={isHighlight ? "Link de la destacada (instagram.com/stories/highlights/... o /s/...)" : "https://www.instagram.com/p/... o /reel/..."}
            className="min-w-[16rem] flex-1 rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1.5 text-sm"
          />
          {isHighlight && (
            <label className="flex items-center gap-2 font-mono text-[11px] text-[var(--ink-muted)]">
              Portada (círculo):
              <input type="file" name="image" accept="image/*" required className="text-xs" />
            </label>
          )}
          <input
            name="caption"
            placeholder="Descripción corta (opcional)"
            className="min-w-[10rem] flex-1 rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1.5 text-sm"
          />
          <button
            type="submit"
            data-cursor="magnetic"
            className="shrink-0 rounded-full bg-[var(--accent)] px-4 py-1.5 font-mono text-[11px] text-[var(--bg)]"
          >
            + Agregar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && <p className="font-mono text-xs text-red-400">{error}</p>}
      {renderSection("highlight", "Destacadas")}
      {renderSection("feed", "Feed")}
    </div>
  );
}
