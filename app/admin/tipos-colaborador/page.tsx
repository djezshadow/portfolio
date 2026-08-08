import { getCollaboratorTypes } from "@/lib/collaborator-types";
import { createCollaboratorType, renameCollaboratorType, deleteCollaboratorType } from "./actions";
import { CollaboratorTypesPanel } from "@/components/admin/collaborator-types-panel";

export const dynamic = "force-dynamic";

export default async function TiposColaboradorPage() {
  const types = await getCollaboratorTypes();

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="mb-8 font-display text-3xl">Tipos de relación</h1>
      <CollaboratorTypesPanel
        types={types}
        createAction={createCollaboratorType}
        renameAction={renameCollaboratorType}
        deleteAction={deleteCollaboratorType}
      />
    </div>
  );
}
