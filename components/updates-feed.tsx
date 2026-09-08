import Link from "next/link";
import type { ResolvedUpdateItem } from "@/lib/updates-feed";

export type UpdateFeedItem = ResolvedUpdateItem;

/**
 * Pedido: "una especie de carrusel animado arriba de todo que vaya
 * pasando lentamente las novedades con sus fotos principales" — loop
 * horizontal continuo (mismo mecanismo que el preset "marquee" del
 * carrusel de categorías: CSS puro, se pausa al pasar el mouse), fotos
 * de fondo con degradé para que el texto siempre se lea. Server
 * Component — la animación es puro CSS, no hace falta JS.
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
  });

  // Se duplica la lista para el loop infinito sin salto — mismo truco
  // que el preset "marquee". "Lentamente" pedido explícito: bastante
  // más tiempo por ítem que el marquee de categorías (que es más rápido
  // a propósito, porque ahí el objetivo es navegar, acá es "dejar
  // pasar" mientras se lee).
  const loopItems = [...items, ...items];
  const duration = Math.max(items.length * 9, 28);

  return (
    <section className="djez-updates-carousel border-b border-[var(--glass-border)] pb-6 pt-4">
      <style>{`
        @keyframes djez-updates-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .djez-updates-track {
          animation: djez-updates-scroll var(--updates-duration, 40s) linear infinite;
        }
        .djez-updates-track:hover {
          animation-play-state: paused;
        }
      `}</style>
      <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-[var(--ink-muted)]">{title}</p>
      <div className="overflow-hidden">
        <div
          className="djez-updates-track flex w-max gap-4"
          style={{ "--updates-duration": `${duration}s` } as React.CSSProperties}
        >
          {loopItems.map((item, i) => {
            const content = (
              <>
                {item.imageUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      alt=""
                      draggable={false}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-[var(--glass-border)]" />
                )}
                {item.featured && (
                  <span className="absolute right-2 top-2 rounded-full bg-[var(--accent)] px-2 py-0.5 font-mono text-[9px] text-[var(--bg)]">
                    ★
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <p className="font-mono text-[9px] text-white/70">{formatter.format(item.date)}</p>
                  <p className="line-clamp-1 font-display text-sm text-white">{item.title}</p>
                </div>
              </>
            );

            const className =
              "group relative block h-32 w-52 shrink-0 overflow-hidden rounded-xl transition-transform duration-300 hover:scale-[1.03]";

            if (!item.href) {
              return (
                <div key={`${item.key}-${i}`} className={className}>
                  {content}
                </div>
              );
            }
            if (item.external) {
              return (
                <a
                  key={`${item.key}-${i}`}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor="magnetic"
                  className={className}
                >
                  {content}
                </a>
              );
            }
            return (
              <Link key={`${item.key}-${i}`} href={`/${locale}${item.href}`} data-cursor="magnetic" className={className}>
                {content}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
