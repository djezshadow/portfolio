import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { createCollaborator } from "./actions";
import { getCollaboratorTypes } from "@/lib/collaborator-types";

export const dynamic = "force-dynamic";

export default async function ColaboradoresPage() {
  const [collaborators, types] = await Promise.all([
    prisma.collaborator.findMany({ orderBy: { name: "asc" }, include: { typeOption: true } }),
    getCollaboratorTypes(),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="mb-8 font-display text-3xl">Colaboradores</h1>

      <div className="mb-10 space-y-3">
        {collaborators.map((c) => (
          <Link
            key={c.id}
            href={`/admin/colaboradores/${c.id}`}
            data-cursor="magnetic"
            className="glass flex items-center gap-4 rounded-xl px-4 py-3"
          >
            {c.logoUrl && (
              <Image src={c.logoUrl} alt={c.name} width={36} height={36} className="rounded-full object-cover" />
            )}
            <div>
              <p>{c.name}</p>
              <p className="font-mono text-[11px] text-[var(--ink-muted)]">
                {c.typeOption?.name ?? c.type}
              </p>
            </div>
          </Link>
        ))}
        {collaborators.length === 0 && (
          <p className="font-mono text-sm text-[var(--ink-muted)]">Todavía no hay colaboradores.</p>
        )}
      </div>

      <h2 className="mb-4 font-display text-xl">Agregar colaborador</h2>
      <form action={createCollaborator} className="space-y-4">
        <div>
          <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Nombre</label>
          <input
            name="name"
            required
            className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Tipo</label>
          <select
            name="type"
            defaultValue={types.find((t) => t.slug === "creative") ? "creative" : types[0]?.slug}
            className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
          >
            {types.map((t) => (
              <option key={t.id} value={t.slug}>
                {t.name}
              </option>
            ))}
          </select>
          <p className="mt-1 font-mono text-[10px] text-[var(--ink-muted)]">
            ¿Necesitás otro tipo? Creálo en{" "}
            <Link href="/admin/tipos-colaborador" className="underline" data-cursor="magnetic">
              Tipos de relación
            </Link>
            .
          </p>
        </div>

        <div>
          <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Instagram (URL)</label>
          <input
            name="instagram"
            className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Website</label>
          <input
            name="website"
            className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Logo (opcional)</label>
          <input name="logo" type="file" accept="image/*" className="w-full font-mono text-sm" />
        </div>

        <button
          type="submit"
          data-cursor="magnetic"
          className="w-full rounded-full bg-[var(--accent)] py-3 font-mono text-sm text-[var(--bg)]"
        >
          Guardar colaborador
        </button>
      </form>
    </div>
  );
}
