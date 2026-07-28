import { prisma } from "@/lib/prisma";
import { createProject } from "./actions";
import { MediaDropzone } from "@/components/admin/media-dropzone";
import { PublishControls } from "@/components/admin/publish-controls";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  const categories = await prisma.category.findMany({ orderBy: { order: "asc" } });

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-3xl">Nuevo proyecto</h1>

      <form action={createProject} className="mt-8 space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Título (Español)</label>
            <input
              name="title"
              required
              className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
              Título (English) — vacío = usa el español
            </label>
            <input
              name="titleEn"
              className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Descripción ES</label>
            <textarea
              name="description"
              rows={3}
              className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
              Descripción EN — vacío = usa el ES
            </label>
            <textarea
              name="descriptionEn"
              rows={3}
              className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Tu rol (ES)</label>
            <input
              name="role"
              placeholder="Director, Editor, DoP…"
              className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
              Tu rol (EN) — vacío = usa el ES
            </label>
            <input
              name="roleEn"
              placeholder="Director, Editor, DoP…"
              className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Categoría</label>
          <select
            name="categoryId"
            required
            className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
          >
            <option value="">Elegí una categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {categories.length === 0 && (
            <p className="mt-1 font-mono text-[11px] text-[var(--accent-contrast)]">
              Todavía no hay categorías —{" "}
              <a href="/admin/categorias/nueva" className="underline">creá una primero</a>.
            </p>
          )}
        </div>

        <label className="flex items-center gap-2 font-mono text-sm">
          <input type="checkbox" name="featured" /> Destacar en el home
        </label>

        <MediaDropzone />


        <PublishControls />

        <button
          type="submit"
          data-cursor="magnetic"
          className="w-full rounded-full bg-[var(--accent)] py-3 font-mono text-sm text-[var(--bg)]"
        >
          Guardar proyecto
        </button>
      </form>
    </div>
  );
}
