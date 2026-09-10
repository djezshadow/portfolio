import { getSiteSettings } from "@/lib/site-settings";
import { prisma } from "@/lib/prisma";
import { getAutoCandidates } from "@/lib/updates-feed";
import {
  updateUpdatesFeedSettings,
  saveAutoFeedOverride,
  createUpdateEntry,
  updateUpdateEntry,
  deleteUpdateEntry,
  moveUpdateEntry,
  reorderUpdateEntries,
} from "./actions";
import { SubmitButton } from "@/components/admin/submit-button";
import { UpdatesPanel } from "@/components/admin/updates-panel";
import { AutoUpdatesPanel } from "@/components/admin/auto-updates-panel";

export const dynamic = "force-dynamic";

export default async function NovedadesAdminPage() {
  let settings = {
    updatesFeedEnabled: false,
    updatesFeedTitle: null as string | null,
    updatesFeedTitleEn: null as string | null,
    updatesFeedSpeed: "normal",
    updatesFeedVisible: 3,
  };
  let entries: {
    id: string;
    title: string;
    titleEn: string | null;
    description: string | null;
    descriptionEn: string | null;
    date: string;
    imageUrl: string | null;
  }[] = [];
  let autoCandidates: {
    sourceType: "project" | "category" | "instagram";
    sourceId: string;
    title: string;
    description: string | null;
    date: string;
    href: string;
    hidden: boolean;
    titleOverride: string | null;
    descriptionOverride: string | null;
    featured: boolean;
    imageUrl: string | null;
    imageUrlOverride: string | null;
  }[] = [];

  try {
    settings = await getSiteSettings();
    const raw = await prisma.updateLogEntry.findMany({ orderBy: { order: "asc" } });
    entries = raw.map((e) => ({ ...e, date: e.date.toISOString() }));

    const [candidates, overrides] = await Promise.all([getAutoCandidates(), prisma.updateFeedOverride.findMany()]);
    const overrideMap = new Map(overrides.map((o) => [`${o.sourceType}:${o.sourceId}`, o]));
    autoCandidates = candidates.map((c) => {
      const override = overrideMap.get(`${c.sourceType}:${c.sourceId}`);
      return {
        sourceType: c.sourceType,
        sourceId: c.sourceId,
        title: c.title,
        description: c.description,
        date: c.date.toISOString(),
        href: c.href,
        hidden: override?.hidden ?? false,
        titleOverride: override?.titleOverride ?? null,
        descriptionOverride: override?.descriptionOverride ?? null,
        featured: c.featured,
        imageUrl: c.imageUrl,
        imageUrlOverride: override?.imageUrlOverride ?? null,
      };
    });
  } catch (err) {
    console.error("No se pudo leer Novedades (¿corriste prisma db push?):", err);
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="mb-2 font-display text-3xl">Novedades</h1>
      <p className="mb-8 text-sm text-[var(--ink-muted)]">
        Se arma sola con lo último que subís (proyectos publicados, categorías nuevas, posts de
        Instagram) — se muestra en el home, si lo activás. Si algo no te cierra, lo podés ocultar
        o corregir más abajo. También podés agregar alguna novedad puntual a mano, para lo que no
        surge de un proyecto/categoría/post real.
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
        <div>
          <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
            Velocidad del carrusel
          </label>
          <select
            name="updatesFeedSpeed"
            defaultValue={settings.updatesFeedSpeed}
            className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
          >
            <option value="detenido">Detenido (solo se mueve si lo arrastrás)</option>
            <option value="lento">Lento</option>
            <option value="normal">Normal</option>
            <option value="rapido">Rápido</option>
          </select>
          <p className="mt-1 font-mono text-[10px] text-[var(--ink-muted)]">
            Sin importar esto, siempre se puede arrastrar a mano (mouse o dedo).
          </p>
        </div>
        <div>
          <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
            Cuántas tarjetas se ven a la vez
          </label>
          <select
            name="updatesFeedVisible"
            defaultValue={settings.updatesFeedVisible}
            className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
            <option value={5}>5</option>
          </select>
          <p className="mt-1 font-mono text-[10px] text-[var(--ink-muted)]">
            En celular se ajusta un poco más chico automáticamente, para que siempre se note que
            hay más deslizando.
          </p>
        </div>
        <SubmitButton>Guardar</SubmitButton>
      </form>

      <h2 className="mb-3 font-display text-xl">Detectado automáticamente</h2>
      <AutoUpdatesPanel candidates={autoCandidates} saveOverrideAction={saveAutoFeedOverride} />

      <h2 className="mb-3 mt-10 font-display text-xl">Agregado a mano</h2>
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
