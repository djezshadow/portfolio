import { getSiteSettings } from "@/lib/site-settings";
import { prisma } from "@/lib/prisma";
import {
  updateUpdatesFeedSettings,
  createUpdateEntry,
  updateUpdateEntry,
  deleteUpdateEntry,
  moveUpdateEntry,
  reorderUpdateEntries,
} from "./actions";
import { SubmitButton } from "@/components/admin/submit-button";
import { UpdatesPanel } from "@/components/admin/updates-panel";

export const dynamic = "force-dynamic";

export default async function NovedadesAdminPage() {
  let settings = {
    updatesFeedEnabled: false,
    updatesFeedTitle: null as string | null,
    updatesFeedTitleEn: null as string | null,
  };
  let entries: {
    id: string;
    title: string;
    titleEn: string | null;
    description: string | null;
    descriptionEn: string | null;
    date: string;
  }[] = [];

  try {
    settings = await getSiteSettings();
    const raw = await prisma.updateLogEntry.findMany({ orderBy: { order: "asc" } });
    entries = raw.map((e) => ({ ...e, date: e.date.toISOString() }));
  } catch (err) {
    console.error("No se pudo leer Novedades (¿corriste prisma db push?):", err);
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="mb-2 font-display text-3xl">Novedades</h1>
      <p className="mb-8 text-sm text-[var(--ink-muted)]">
        Un resumen curado a mano de lo que vas actualizando en el sitio — se muestra en el home,
        si lo activás. No se genera solo: vos elegís qué contar, con qué fecha, y lo podés
        corregir o borrar cuando quieras.
      </p>

      <form action={updateUpdatesFeedSettings} className="glass mb-8 space-y-4 rounded-2xl p-5">
        <label className="flex items-center gap-2 font-mono text-sm">
          <input type="checkbox" name="updatesFeedEnabled" defaultChecked={settings.updatesFeedEnabled} />
          Mostrar la sección de Novedades en el home
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Título de la sección (ES)</label>
            <input
              name="updatesFeedTitle"
              defaultValue={settings.updatesFeedTitle ?? ""}
              placeholder="Novedades"
              className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Título de la sección (EN)</label>
            <input
              name="updatesFeedTitleEn"
              defaultValue={settings.updatesFeedTitleEn ?? ""}
              placeholder="What's new"
              className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
            />
          </div>
        </div>
        <SubmitButton>Guardar</SubmitButton>
      </form>

      <UpdatesPanel
        entries={entries}
        addAction={createUpdateEntry}
        editAction={updateUpdateEntry}
        deleteAction={deleteUpdateEntry}
        moveAction={moveUpdateEntry}
        reorderAction={reorderUpdateEntries}
      />
    </div>
  );
}
