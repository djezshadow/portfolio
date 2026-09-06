import Link from "next/link";

export type UpdateFeedItem = {
  key: string;
  title: string;
  description: string | null;
  date: Date;
  href: string;
  external: boolean;
};

/**
 * Pedido: "que vaya mostrando lo nuevo... como accesos directos" — cada
 * ítem es clickeable (proyecto/categoría abren en el sitio, Instagram
 * abre afuera). Server Component simple, no necesita "use client".
 */
export function UpdatesFeed({
  title,
  items,
  locale,
}: {
  title: string;
  items: UpdateFeedItem[];
  locale: string;
}) {
  if (items.length === 0) return null;

  const formatter = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <section className="pb-24">
      <h2 className="mb-6 font-mono text-xs uppercase tracking-widest text-[var(--ink-muted)]">{title}</h2>
      <div className="space-y-3">
        {items.map((item) => {
          const content = (
            <>
              <span className="shrink-0 font-mono text-[10px] text-accent">{formatter.format(item.date)}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-sm">{item.title}</span>
                {item.description && (
                  <span className="mt-0.5 block text-xs text-[var(--ink-muted)]">{item.description}</span>
                )}
              </span>
            </>
          );

          const className = "glass flex items-center gap-4 rounded-2xl p-4 transition-colors hover:bg-white/5";

          if (!item.href) {
            return (
              <div key={item.key} className={className}>
                {content}
              </div>
            );
          }
          if (item.external) {
            return (
              <a key={item.key} href={item.href} target="_blank" rel="noopener noreferrer" data-cursor="magnetic" className={className}>
                {content}
              </a>
            );
          }
          return (
            <Link key={item.key} href={`/${locale}${item.href}`} data-cursor="magnetic" className={className}>
              {content}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
