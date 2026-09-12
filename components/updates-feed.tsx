"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { ResolvedUpdateItem } from "@/lib/updates-feed";

export type UpdateFeedItem = ResolvedUpdateItem;

const SPEED_PX_PER_SEC: Record<string, number> = {
  detenido: 0,
  lento: 16,
  normal: 32,
  rapido: 58,
};

// Pausado a pedido explícito: el auto-scroll (RAF + scrollLeft) no se
// estaba moviendo de forma confiable en producción a pesar de varios
// intentos de arreglarlo (ancho del track, pausa por hover, etc.) y no
// hay forma de probarlo en un navegador real desde acá. El arrastre
// manual (mouse/touch) sigue andando siempre — es una función aparte.
// Para reactivar el auto-scroll cuando se pueda debuggear en vivo:
// cambiar esto a `false`.
const AUTO_SCROLL_PAUSED = true;

const GAP_PX = 16;

/**
 * Pedido: "carrusel animado arriba de todo... que vaya pasando
 * lentamente las novedades con sus fotos principales", después "poder
 * deslizarlo yo también, cambiar la velocidad, y hasta dejarlo quieto",
 * y por último "que muestre de a tres casillas y eso lo pueda cambiar
 * en admin".
 *
 * OJO con esto: antes se pausaba también al pasar el mouse por encima
 * — que es justo donde tenés la vista puesta al mirarlo, así que se
 * sentía "quieto mientras miro" aunque en realidad estaba andando bien
 * apenas sacabas el mouse. Ahora SOLO se pausa mientras lo estás
 * arrastrando activamente, nunca por el simple hecho de tenerle el
 * mouse encima.
 */
export function UpdatesFeed({
  title,
  items,
  locale,
  speed = "normal",
  visibleCount = 3,
}: {
  title: string;
  items: UpdateFeedItem[];
  locale: string;
  speed?: string;
  visibleCount?: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollRef = useRef(0);
  const movedRef = useRef(false);

  const speedPxPerSec = SPEED_PX_PER_SEC[speed] ?? SPEED_PX_PER_SEC.normal;
  // Con pocos ítems, duplicar la lista una sola vez puede no alcanzar a
  // ser más ancho que la pantalla — y sin nada para desplazar, el
  // navegador no mueve el scroll aunque el código se lo pida. Repetimos
  // el set base las veces que hagan falta para garantizar ancho de
  // sobra, y recién ahí lo duplicamos para el loop sin salto.
  const MIN_BASE_ITEMS = 10;
  const repeatCount = Math.max(1, Math.ceil(MIN_BASE_ITEMS / Math.max(1, items.length)));
  const base = Array.from({ length: repeatCount }, () => items).flat();
  const loopItems = [...base, ...base];

  useEffect(() => {
    if (AUTO_SCROLL_PAUSED) return;

    const track = trackRef.current;
    if (!track || speedPxPerSec === 0) return;

    let raf: number;
    let last = performance.now();

    function step(now: number) {
      const dt = (now - last) / 1000;
      last = now;
      if (track && !draggingRef.current) {
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
  }, [speedPxPerSec]);

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
      <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-[var(--ink-muted)]">{title}</p>
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        className="flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ cursor: "grab", scrollBehavior: "auto", gap: GAP_PX }}
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
            "djez-updates-card group relative block h-32 shrink-0 overflow-hidden rounded-xl transition-transform duration-300 hover:scale-[1.03] select-none";

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
