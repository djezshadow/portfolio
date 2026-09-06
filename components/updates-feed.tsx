type UpdateEntryPublic = { id: string; title: string; description: string | null; date: Date };

/**
 * Pedido: "una sección que vaya mostrando lo nuevo que se va
 * actualizando en la página, un resumen". Server Component simple — no
 * necesita interactividad, así que no hace falta "use client".
 */
export function UpdatesFeed({ title, entries, locale }: { title: string; entries: UpdateEntryPublic[]; locale: string }) {
  if (entries.length === 0) return null;

  const formatter = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <section className="pb-24">
      <h2 className="mb-6 font-mono text-xs uppercase tracking-widest text-[var(--ink-muted)]">{title}</h2>
      <div className="space-y-4">
        {entries.map((entry) => (
          <div key={entry.id} className="glass flex gap-4 rounded-2xl p-4">
            <span className="shrink-0 font-mono text-[10px] text-accent">{formatter.format(entry.date)}</span>
            <div>
              <p className="font-display text-sm">{entry.title}</p>
              {entry.description && <p className="mt-1 text-xs text-[var(--ink-muted)]">{entry.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
