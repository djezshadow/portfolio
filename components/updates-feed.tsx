"use client";

import { useEffect, useRef, useState } from "react";
import { PortfolioDialog } from "./portfolio-dialog";
import Link from "next/link";
import { useHorizontalRail } from "@/lib/use-horizontal-rail";
import type { ResolvedUpdateItem } from "@/lib/updates-feed";

export type UpdateFeedItem = ResolvedUpdateItem;

const GAP_PX = 16;

export function UpdatesFeed({
  title,
  items,
  locale,
  visibleCount = 3,
}: {
  title: string;
  items: UpdateFeedItem[];
  locale: string;
  visibleCount?: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const rail = useHorizontalRail({ mouse: true });

  const [detail, setDetail] = useState<UpdateFeedItem | null>(null);
  const [edges, setEdges] = useState({ prev: false, next: false });
  const en = locale === "en";

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const update = () => setEdges({ prev: track.scrollLeft > 2, next: track.scrollLeft + track.clientWidth < track.scrollWidth - 2 });
    const observer = new ResizeObserver(update);
    observer.observe(track);
    track.addEventListener("scroll", update, { passive: true });
    update();
    return () => {
      observer.disconnect();
      track.removeEventListener("scroll", update);
    };
  }, [items.length, visibleCount]);

  function step(direction: number) {
    const track = trackRef.current;
    const first = track?.firstElementChild;
    if (track && first) track.scrollBy({ left: (first.getBoundingClientRect().width + GAP_PX) * direction,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }

  function hrefFor(item: UpdateFeedItem) {
    if (item.external || /^\/(es|en)(?:\/|[?#]|$)/.test(item.href)) return item.href;
    return `/${locale}${item.href}`;
  }

  if (items.length === 0) return null;

  const formatter = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-AR", {
    day: "numeric",
    month: "short",
  });

  // Pedido: "que muestre de a tres casillas y eso lo pueda cambiar en
  // admin" — el ancho de cada tarjeta se calcula para que ENTREN
  // exactamente `visibleCount` a la vez en el ancho disponible. En
  // celular achicamos un poco el conteo (mínimo 1.4, para que siempre
  // se note que hay más deslizando) sin necesidad de JS extra — un
  // segundo valor vía CSS clamp según el viewport.
  const desktopWidth = `calc((100% - ${GAP_PX * (visibleCount - 1)}px) / ${visibleCount})`;
  const mobileVisible = Math.max(1.4, Math.min(visibleCount, 2));
  const mobileWidth = `calc((100% - ${GAP_PX * (Math.ceil(mobileVisible) - 1)}px) / ${mobileVisible})`;

  return (
    <section className="djez-updates-carousel border-b border-[var(--glass-border)] pb-6 pt-4">
      <style>{`
        .djez-updates-card { width: ${mobileWidth}; }
        @media (min-width: 640px) {
          .djez-updates-card { width: ${desktopWidth}; }
        }
      `}</style>
      <p className="mb-3 text-center font-mono text-[10px] uppercase tracking-widest text-[var(--ink-muted)] sm:text-left">{title}</p>
      <div
        ref={trackRef}
        {...rail}
        onContextMenu={(event) => {
          if ((event.target as Element).closest(".carousel-cover-card")) event.preventDefault();
        }}
        onDragStart={(event) => event.preventDefault()}
        className="horizontal-rail updates-track flex min-w-0 max-w-full overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ "--rail-card-width": mobileWidth, "--rail-gap": `${GAP_PX}px`, cursor: "grab", gap: GAP_PX } as React.CSSProperties}
      >
        {items.map((item) => {
          const content = (
            <>
              {item.imageUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl}
                    alt=""
                    draggable={false}
                    loading="lazy"
                    decoding="async"
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

          const clickable = Boolean(item.href || item.description && item.showDetail);
          const className = `carousel-cover-card djez-updates-card relative block h-32 shrink-0 overflow-hidden rounded-xl ${clickable ? "cursor-pointer motion-safe:transition-transform motion-safe:hover:scale-[1.03]" : ""}`;

          if (item.description && item.showDetail) {
            return <button key={item.key} type="button" aria-haspopup="dialog"
              onClick={() => setDetail(item)} className={`${className} text-left`}>{content}</button>;
          }
          if (!item.href) {
            return (
              <div key={item.key} className={className}>
                {content}
              </div>
            );
          }
          if (item.external) {
            return (
              <a
                key={item.key}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="magnetic"
                draggable={false}
                className={className}
              >
                {content}
              </a>
            );
          }
          return (
            <Link
              key={item.key}
              href={hrefFor(item)}
              data-cursor="magnetic"
              draggable={false}
              className={className}
            >
              {content}
            </Link>
          );
        })}
      </div>
      {(edges.prev || edges.next) && <div className="mt-3 flex justify-center gap-2 sm:justify-end">
        <button type="button" className="glass min-h-10 rounded-full px-4 disabled:opacity-40" onClick={() => step(-1)} disabled={!edges.prev}>{en ? "Previous" : "Anterior"}</button>
        <button type="button" className="glass min-h-10 rounded-full px-4 disabled:opacity-40" onClick={() => step(1)} disabled={!edges.next}>{en ? "Next" : "Siguiente"}</button>
      </div>}
      {detail && <PortfolioDialog title={detail.title} onClose={() => setDetail(null)} closeLabel={en ? "Close" : "Cerrar"}>
        <p className="whitespace-pre-line break-words text-sm">{detail.description}</p>
        {detail.href && <Link href={hrefFor(detail)} target={detail.external ? "_blank" : undefined}
          rel={detail.external ? "noopener noreferrer" : undefined} className="mt-4 block text-accent underline"
          onClick={() => setDetail(null)}>{en ? "Open link" : "Abrir enlace"}</Link>}
      </PortfolioDialog>}
    </section>
  );
}
