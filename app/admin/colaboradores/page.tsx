import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { createCollaborator } from "./actions";

export const dynamic = "force-dynamic";

export default async function ColaboradoresPage() {
  const collaborators = await prisma.collaborator.findMany({ orderBy: { name: "asc" } });

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
                {c.type === "client" ? "Cliente" : "Colaborador creativo"}
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
            className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
          >
            <option value="creative">Colaborador creativo</option>
            <option value="client">Cliente</option>
          </select>
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
