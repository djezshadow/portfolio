"use client";

import { useState, useTransition } from "react";

type Post = { id: string; url: string; caption: string | null; section: string };

export function InstagramPostsPanel({
  posts,
  addAction,
  deleteAction,
  moveAction,
}: {
  posts: Post[];
  addAction: (formData: FormData) => Promise<void>;
  deleteAction: (postId: string, formData: FormData) => Promise<void>;
  moveAction: (postId: string, direction: "up" | "down") => Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function renderSection(section: "feed" | "highlight", label: string) {
    const list = posts.filter((p) => p.section === section);
    return (
      <div className="glass space-y-3 rounded-2xl p-5">
        <p className="font-mono text-xs uppercase tracking-widest text-[var(--ink-muted)]">{label}</p>

        <ul className="space-y-2">
          {list.map((p, i) => {
            const remove = deleteAction.bind(null, p.id);
            return (
              <li key={p.id} className="flex flex-wrap items-center gap-2 border-b border-[var(--glass-border)] pb-2">
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
                <div className="min-w-0 flex-1">
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="block truncate font-mono text-xs text-accent">
                    {p.url}
                  </a>
                  {p.caption && <p className="truncate text-xs text-[var(--ink-muted)]">{p.caption}</p>}
                </div>
                <form action={remove}>
                  <button
                    type="submit"
                    data-cursor="magnetic"
                    className="shrink-0 rounded-full border border-red-400/40 px-3 py-1 font-mono text-[11px] text-red-400"
                  >
                    Borrar
                  </button>
                </form>
              </li>
            );
          })}
          {list.length === 0 && (
            <li className="font-mono text-xs text-[var(--ink-muted)]">Todavía no hay posts acá.</li>
          )}
        </ul>

        <form
          action={async (formData: FormData) => {
            setError(null);
            try {
              await addAction(formData);
            } catch (err) {
              setError(err instanceof Error ? err.message : "No se pudo agregar el post.");
            }
          }}
          className="flex flex-wrap gap-2"
        >
          <input type="hidden" name="section" value={section} />
          <input
            name="url"
            required
            placeholder="https://www.instagram.com/p/... o /reel/..."
            className="min-w-[16rem] flex-1 rounded-lg border border-[var(--glass-border)] bg-transparent px-2 py-1.5 text-sm"
          />
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
