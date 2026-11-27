export function ProjectEditorialFields({ initial }: { initial?: {
  featuredRank: number | null;
  behindScenes: string | null;
  behindScenesEn: string | null;
} }) {
  const fieldClass = "block w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2";
  return <fieldset className="glass space-y-4 rounded-2xl p-4">
    <legend className="px-2 font-display text-lg">Presentación del trabajo</legend>
    <label className="block space-y-1 text-sm">
      <span>Orden en Trabajos seleccionados</span>
      <input type="number" name="featuredRank" min={1} max={999} defaultValue={initial?.featuredRank ?? ""} className={fieldClass} />
    </label>
    <p className="text-sm text-[var(--ink-muted)]">Marcá el proyecto como destacado y poné 1 para usarlo como portada principal. Los destacados sin número quedan después.</p>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block space-y-1 text-sm">
        <span>Detrás de cámara (ES)</span>
        <textarea name="behindScenes" rows={4} maxLength={6000} defaultValue={initial?.behindScenes ?? ""} className={fieldClass} />
      </label>
      <label className="block space-y-1 text-sm">
        <span>Detrás de cámara (EN)</span>
        <textarea name="behindScenesEn" rows={4} maxLength={6000} defaultValue={initial?.behindScenesEn ?? ""} className={fieldClass} />
      </label>
    </div>
  </fieldset>;
}
