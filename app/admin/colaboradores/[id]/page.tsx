import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateCollaborator, deleteCollaborator } from "../actions";
import { DeleteButton } from "@/components/admin/delete-button";

export const dynamic = "force-dynamic";

export default async function EditCollaboratorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const collaborator = await prisma.collaborator.findUnique({ where: { id } });
  if (!collaborator) notFound();

  const action = updateCollaborator.bind(null, collaborator.id);
  const removeAction = deleteCollaborator.bind(null, collaborator.id);

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-2xl">Editar colaborador</h1>
        <DeleteButton
          action={removeAction}
          confirmText={`¿Borrar a "${collaborator.name}"? Los proyectos que lo mencionan quedan sin colaborador asignado.`}
        />
      </div>

      {collaborator.logoUrl && (
        <Image
          src={collaborator.logoUrl}
          alt={collaborator.name}
          width={64}
          height={64}
          className="mb-4 rounded-full object-cover"
        />
      )}

      <form action={action} className="space-y-4">
        <div>
          <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Nombre</label>
          <input
            name="name"
            required
            defaultValue={collaborator.name}
            className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Tipo</label>
          <select
            name="type"
            defaultValue={collaborator.type}
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
            defaultValue={collaborator.instagram ?? ""}
            className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Website</label>
          <input
            name="website"
            defaultValue={collaborator.website ?? ""}
            className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
            Reemplazar logo (opcional)
          </label>
          <input name="logo" type="file" accept="image/*" className="w-full font-mono text-sm" />
        </div>

        <button
          type="submit"
          data-cursor="magnetic"
          className="w-full rounded-full bg-[var(--accent)] py-3 font-mono text-sm text-[var(--bg)]"
        >
          Guardar cambios
        </button>
      </form>
    </div>
  );
}
