import { prisma } from "@/lib/prisma";
import { createProject } from "./actions";
import { MediaDropzone } from "@/components/admin/media-dropzone";
import { PublishControls } from "@/components/admin/publish-controls";
import { SubmitButton } from "@/components/admin/submit-button";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  const [categories, collaborators] = await Promise.all([
    prisma.category.findMany({ orderBy: { order: "asc" } }),
    prisma.collaborator.findMany({ orderBy: { name: "asc" }, include: { typeOption: true } }),
  ]);

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

        <div>
          <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
            Colaboración (opcional)
          </label>
          <select
            name="collaboratorId"
            className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
          >
            <option value="">Ninguna — trabajo solo en este proyecto</option>
            {collaborators.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({(c.typeOption?.name ?? c.type).toLowerCase()})
              </option>
            ))}
          </select>
          {collaborators.length === 0 && (
            <p className="mt-1 font-mono text-[11px] text-[var(--ink-muted)]">
              No hay colaboradores cargados —{" "}
              <a href="/admin/colaboradores" className="underline">agregar uno</a> (opcional).
            </p>
          )}
        </div>

        <div className="glass space-y-3 rounded-2xl p-4">
          <p className="font-mono text-xs text-[var(--ink-muted)]">Fechas (opcional, tipo CV)</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Desde</label>
              <input
                type="month"
                name="dateStart"
                className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Hasta</label>
              <input
                type="month"
                name="dateEnd"
                className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 font-mono text-sm">
            <input type="checkbox" name="isOngoing" /> Sigo trabajando en esto actualmente (ignora "Hasta")
          </label>
        </div>

        <label className="flex items-center gap-2 font-mono text-sm">
          <input type="checkbox" name="featured" /> Destacar en el home
        </label>

        <MediaDropzone />


        <PublishControls />

        <SubmitButton>Guardar proyecto</SubmitButton>
      </form>
    </div>
  );
}
