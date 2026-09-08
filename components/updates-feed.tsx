"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { ResolvedUpdateItem } from "@/lib/updates-feed";

export type UpdateFeedItem = ResolvedUpdateItem;

const SPEED_PX_PER_SEC: Record<string, number> = {
  detenido: 0,
  lento: 16,
  normal: 32,
  rapido: 58,
};

/**
 * Pedido: "carrusel animado arriba de todo... que vaya pasando
 * lentamente las novedades con sus fotos principales", y después:
 * "poder deslizarlo yo también, cambiar la velocidad, y hasta dejarlo
 * quieto". Contenedor con scroll horizontal REAL (no solo una animación
 * CSS fija) — así el touch funciona nativo, y el mouse se puede
 * arrastrar a mano (clic y arrastre). El auto-scroll es un
 * requestAnimationFrame que mueve scrollLeft de a poco y hace loop sin
 * salto (la lista está duplicada, y al pasar el ancho de una copia
 * completa se resetea el scroll silenciosamente). Se pausa solo al
 * pasar el mouse o mientras se está arrastrando.
 */
export function UpdatesFeed({
  title,
  items,
  locale,
  speed = "normal",
}: {
  title: string;
  items: UpdateFeedItem[];
  locale: string;
  speed?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const draggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollRef = useRef(0);
  const movedRef = useRef(false);

  const speedPxPerSec = SPEED_PX_PER_SEC[speed] ?? SPEED_PX_PER_SEC.normal;
  const loopItems = [...items, ...items];

  useEffect(() => {
    const track = trackRef.current;
    if (!track || speedPxPerSec === 0) return;

    let raf: number;
    let last = performance.now();

    function step(now: number) {
      const dt = (now - last) / 1000;
      last = now;
      if (!paused && track && !draggingRef.current) {
        track.scrollLeft += speedPxPerSec * dt;
        // Loop sin salto: la lista está duplicada, así que al pasar el
        // ancho de la MITAD (una copia completa) restamos ese ancho —
        // como la copia siguiente es visualmente idéntica, no se nota.
        const halfWidth = track.scrollWidth / 2;
        if (track.scrollLeft >= halfWidth) {
          track.scrollLeft -= halfWidth;
        }
      }
      raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [paused, speedPxPerSec]);

  function onPointerDown(e: React.PointerEvent) {
    const track = trackRef.current;
    if (!track) return;
    draggingRef.current = true;
    movedRef.current = false;
    dragStartXRef.current = e.clientX;
    dragStartScrollRef.current = track.scrollLeft;
    track.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    const track = trackRef.current;
    if (!track || !draggingRef.current) return;
    const dx = e.clientX - dragStartXRef.current;
    if (Math.abs(dx) > 3) movedRef.current = true;
    track.scrollLeft = dragStartScrollRef.current - dx;
  }
  function endDrag() {
    draggingRef.current = false;
  }
  function onClickCapture(e: React.MouseEvent) {
    // Si hubo arrastre real, no dejamos que el click abra el link — así
    // "arrastrar para mirar" no navega por accidente.
    if (movedRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  if (items.length === 0) return null;

  const formatter = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-AR", {
    day: "numeric",
    month: "short",
  });

  return (
    <section className="djez-updates-carousel border-b border-[var(--glass-border)] pb-6 pt-4">
      <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-[var(--ink-muted)]">{title}</p>
      <div
        ref={trackRef}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => {
          setPaused(false);
          endDrag();
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        className="flex gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ cursor: "grab", scrollBehavior: "auto" }}
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
            "group relative block h-32 w-52 shrink-0 overflow-hidden rounded-xl transition-transform duration-300 hover:scale-[1.03] select-none";

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
                draggable={false}
                className={className}
              >
                {content}
              </a>
            );
          }
          return (
            <Link
              key={`${item.key}-${i}`}
              href={`/${locale}${item.href}`}
              data-cursor="magnetic"
              draggable={false}
              className={className}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
