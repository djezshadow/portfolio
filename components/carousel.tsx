"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useHorizontalRail } from "@/lib/use-horizontal-rail";
import { PortfolioDialog } from "./portfolio-dialog";

export type CarouselItem = {
  id: string;
  title: string;
  subtitle?: string;
  code: string; // timecode/etiqueta tipo SC-01
  href?: string;
  /// Portada opcional — todos los presets la soportan de alguna forma
  /// (fondo, círculo, franja, etc). Sin portada, cada preset cae a un
  /// estilo tipográfico propio.
  coverImageUrl?: string | null;
  /// Se calcula en el server a partir del brillo real de la foto de
  /// portada (pendiente del PDF: "que los textos se adapten al fondo").
  /// true = la portada es clara y necesita texto/degradé oscuro; false
  /// (default) = portada oscura o sin portada, sigue como antes (texto
  /// claro sobre degradé negro).
  coverTextDark?: boolean;
  /// Coming soon: la card se ve gris/bloqueada y al tocarla muestra un
  /// popup con `hint` en vez de navegar.
  isComingSoon?: boolean;
  hint?: string | null;
};

export type CarouselPreset =
  | "cards"
  | "minimal"
  | "stack"
  | "filmstrip"
  | "editorial"
  | "marquee"
  | "split"
  | "polaroid";

/** Personalización fina por encima del preset elegido (pendiente del PDF:
 * "personalización individual por carrusel"). Todo opcional — sin pasar
 * nada, se ve exactamente como antes. `background`/`shadow`/`glass` se
 * notan sobre todo en los presets tipo tarjeta (Cards, Marquee); en los
 * presets con una identidad física propia (Polaroid, Filmstrip, Split,
 * Stack) solo afectan tamaño y separación, para no romper su estética. */
export type CarouselStyleConfig = {
  itemSize?: "sm" | "md" | "lg";
  gap?: number;
  background?: "transparent" | "surface";
  shadow?: boolean;
  glass?: boolean;
  /// Alineación de la fila/grilla completa dentro de su contenedor
  /// (pendiente del PDF: "que el carrusel tenga opciones de alineación").
  /// Se nota sobre todo cuando hay pocos ítems y sobra espacio horizontal
  /// — con la fila llena (scroll horizontal) el efecto es mínimo, algo
  /// esperable ya que no hay "aire" de sobra para mover.
  align?: "left" | "center" | "right";
};

type CarouselProps = {
  items: CarouselItem[];
  /** Máximo de ítems a mostrar (no hay mínimo — con 1 alcanza) */
  maxItems?: number;
  preset?: CarouselPreset;
  comingSoonLabel?: string;
  style?: CarouselStyleConfig;
};

function ItemWrapper({
  href,
  comingSoon,
  onComingSoonClick,
  className,
  style,
  children,
}: {
  href?: string;
  comingSoon?: boolean;
  onComingSoonClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const coverProps = {
    onContextMenu: (event: React.MouseEvent) => event.preventDefault(),
    onDragStart: (event: React.DragEvent) => event.preventDefault(),
  };
  const cardClassName = `carousel-cover-card ${className ?? ""}`;
  if (comingSoon) {
    return (
      <button
        type="button"
        onClick={onComingSoonClick}
        data-cursor="magnetic"
        style={style}
        {...coverProps}
        className={`${cardClassName} grayscale opacity-60 saturate-0 transition-opacity hover:opacity-75`}
      >
        {children}
      </button>
    );
  }
  if (href) {
    return (
      <Link href={href} data-cursor="magnetic" style={style} draggable={false} {...coverProps} className={cardClassName}>
        {children}
      </Link>
    );
  }
  return (
    <div data-cursor="magnetic" style={style} {...coverProps} className={cardClassName}>
      {children}
    </div>
  );
}

function LockBadge() {
  return (
    <span className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white">
      🔒
    </span>
  );
}

/** Rotación pseudo-random pero DETERMINÍSTICA (mismo resultado en server
 * y cliente, así no hay hydration mismatch) — usada por el preset Polaroid. */
function pseudoRotation(i: number): number {
  const values = [-6, 4, -3, 6, -5, 3, -4, 5, -2, 2];
  return values[i % values.length];
}

export function Carousel({
  items,
  maxItems = 10,
  preset = "cards",
  comingSoonLabel = "Próximamente",
  style,
}: CarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const rail = useHorizontalRail();
  const [hintOpen, setHintOpen] = useState<{ title: string; hint: string | null } | null>(null);

  const [edges, setEdges] = useState({ prev: false, next: false });
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    function update() {
      if (!track) return;
      setEdges({ prev: track.scrollLeft > 2, next: track.scrollLeft + track.clientWidth < track.scrollWidth - 2 });
    }
    const observer = new ResizeObserver(update);
    observer.observe(track);
    Array.from(track.children).forEach((card) => observer.observe(card));
    track.addEventListener("scroll", update, { passive: true });
    update();
    return () => {
      observer.disconnect();
      track.removeEventListener("scroll", update);
    };
  }, [preset, items.length, maxItems, style?.gap, style?.itemSize, style?.align]);

  // Con 0 categorías no hay nada que mostrar. Con 1 o más, se muestran
  // todas — nunca se esconde la sección entera por tener "pocas".
  if (items.length === 0) return null;

  const visible = items.slice(0, maxItems);

  // Escala de tamaño (sm/md/lg) sobre las dimensiones base de cada
  // preset, y separación configurable entre ítems.
  const sizeScale = style?.itemSize === "sm" ? 0.82 : style?.itemSize === "lg" ? 1.2 : 1;
  const gapPx = style?.gap ?? 16;
  // Fondo/sombra/glass tienen más sentido en los presets tipo tarjeta
  // (Cards, Marquee) — los demás ya tienen una identidad visual propia
  // (negativo de 35mm, foto Polaroid, etc.) que no queremos taparle.
  const cardGlass = style?.glass ?? true;
  const cardShadow = style?.shadow ? "shadow-[0_12px_30px_rgba(0,0,0,0.35)]" : "shadow-none";
  const cardBg = cardGlass ? "glass" : style?.background === "surface" ? "bg-[var(--glass-border)]" : "bg-transparent";
  // Clases de alineación — flexJustify para presets con fila flex,
  // gridJustify para los que usan grid (justify-items en vez de
  // justify-content, porque en grid las columnas tienen ancho fijo y lo
  // que hay que mover es el bloque de columnas dentro del contenedor).
  // Polaroid ya centraba por defecto antes de que existiera esta opción
  // — si nadie toca "align", que siga viéndose igual que siempre.
  const effectiveAlign = style?.align ?? (preset === "polaroid" ? "center" : "left");
  const alignFlex =
    effectiveAlign === "center" ? "justify-center-safe" : effectiveAlign === "right" ? "justify-end-safe" : "justify-start";
  const baseWidth = preset === "filmstrip" ? 160 : preset === "marquee" ? 240 : 280;
  const trackGap = preset === "filmstrip" ? gapPx * 0.75 : gapPx;
  const trackStyle = {
    gap: trackGap,
    "--rail-gap": `${trackGap}px`,
    "--rail-card-width": `min(${baseWidth * sizeScale}px, 82vw)`,
  } as React.CSSProperties;

  const scrollBy = (dir: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const trackBounds = track.getBoundingClientRect();
    const anchor = matchMedia("(max-width: 639px)").matches ? effectiveAlign : "left";
    const offsets = Array.from(track.children, (card) => {
      const bounds = card.getBoundingClientRect();
      if (anchor === "center") return (bounds.left + bounds.right - trackBounds.left - trackBounds.right) / 2;
      if (anchor === "right") return bounds.right - trackBounds.right;
      return bounds.left - trackBounds.left;
    });
    const delta = dir > 0 ? offsets.find((offset) => offset > 3) : offsets.filter((offset) => offset < -3).at(-1);
    if (delta === undefined) return;
    track.scrollBy({ left: delta, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };

  function openHint(item: CarouselItem) {
    setHintOpen({ title: item.title, hint: item.hint ?? null });
  }

  const HintPopup = hintOpen && (
    <PortfolioDialog title={hintOpen.title} onClose={() => setHintOpen(null)}>
      <p className="text-sm text-accent">{comingSoonLabel}</p>
      {hintOpen.hint && <p className="mt-2 text-sm">{hintOpen.hint}</p>}
    </PortfolioDialog>
  );
  const trackClass = `carousel-track horizontal-rail flex min-w-0 max-w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain pb-3 [scrollbar-width:thin] ${alignFlex}`;
  const controls = (edges.prev || edges.next) && (
    <div className="mt-2 flex justify-center gap-2 sm:justify-end">
      <button type="button" disabled={!edges.prev} onClick={() => scrollBy(-1)}
        className="glass rounded-full px-4 py-2 text-sm disabled:opacity-40" aria-label="Anterior">‹</button>
      <button type="button" disabled={!edges.next} onClick={() => scrollBy(1)}
        className="glass rounded-full px-4 py-2 text-sm disabled:opacity-40" aria-label="Siguiente">›</button>
    </div>
  );

  // ============================= MINIMAL =============================
  if (preset === "minimal") {
    return (
      <>
        <div className="divide-y divide-[var(--glass-border)]">
          {visible.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <ItemWrapper
                href={item.href}
                comingSoon={item.isComingSoon}
                onComingSoonClick={() => openHint(item)}
                className="flex w-full items-center justify-between gap-4 py-4 text-left transition-colors hover:text-accent"
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono text-[11px] text-accent">{item.code}</span>
                  <h3 className="font-display text-lg">
                    {item.title}
                    {item.isComingSoon && " 🔒"}
                  </h3>
                </div>
                {item.subtitle && !item.isComingSoon && (
                  <span className="font-mono text-xs text-[var(--ink-muted)]">{item.subtitle}</span>
                )}
              </ItemWrapper>
            </motion.div>
          ))}
        </div>
        {HintPopup}
      </>
    );
  }

  // ============================== STACK ===============================
  if (preset === "stack") {
    return (
      <>
        <div className={`flex flex-wrap ${alignFlex}`} style={{ columnGap: gapPx / 2, rowGap: gapPx * 1.5 }}>
          {visible.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              style={{ marginLeft: i === 0 ? 0 : -16 * sizeScale }}
            >
              <ItemWrapper
                href={item.href}
                comingSoon={item.isComingSoon}
                onComingSoonClick={() => openHint(item)}
                className="flex flex-col items-center gap-2 text-center"
              >
                <span
                  className="glass relative flex items-center justify-center overflow-hidden rounded-full font-display text-lg"
                  style={{ zIndex: visible.length - i, height: 80 * sizeScale, width: 80 * sizeScale }}
                >
                  {item.isComingSoon ? (
                    "🔒"
                  ) : item.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.coverImageUrl} loading="lazy" decoding="async" alt="" draggable={false} onContextMenu={(e) => e.preventDefault()} className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    item.code.replace("SC-", "")
                  )}
                </span>
                <span className="max-w-[90px] font-mono text-[10px] leading-tight">{item.title}</span>
              </ItemWrapper>
            </motion.div>
          ))}
        </div>
        {HintPopup}
      </>
    );
  }

  // ============================ FILMSTRIP =============================
  // Tiras angostas y altas tipo negativo de 35mm, con perforaciones
  // decorativas arriba/abajo — coherente con la estética timecode.
  if (preset === "filmstrip") {
    return (
      <>
        <div
          ref={trackRef} {...rail}
          className={trackClass}
          data-align={effectiveAlign}
          style={trackStyle}
        >
          {visible.map((item, i) => (
            <motion.div
              key={item.id}
              className="shrink-0 snap-start"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <ItemWrapper
                href={item.href}
                comingSoon={item.isComingSoon}
                onComingSoonClick={() => openHint(item)}
                style={{ width: "var(--rail-card-width)" }}
                className="group relative block shrink-0 overflow-hidden rounded-sm bg-black text-left"
              >
                {item.isComingSoon && <LockBadge />}
                {/* perforaciones */}
                <div className="flex justify-between bg-black px-1.5 py-1">
                  {Array.from({ length: 6 }).map((_, h) => (
                    <span key={h} className="h-2 w-2 rounded-[2px] bg-[var(--bg)]" />
                  ))}
                </div>
                <div className="relative aspect-[3/4] w-full">
                  {item.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.coverImageUrl} loading="lazy" decoding="async"
                      alt=""
                      draggable={false}
                      onContextMenu={(e) => e.preventDefault()}
                      className="h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[var(--glass-border)]">
                      <span className="font-mono text-2xl text-white/40">{item.code.replace("SC-", "")}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between bg-black px-1.5 py-1">
                  {Array.from({ length: 6 }).map((_, h) => (
                    <span key={h} className="h-2 w-2 rounded-[2px] bg-[var(--bg)]" />
                  ))}
                </div>
                <div className="bg-black p-2 text-white">
                  <p className="font-mono text-[9px] text-accent">{item.isComingSoon ? comingSoonLabel : item.code}</p>
                  <p className="truncate font-display text-sm">{item.title}</p>
                </div>
              </ItemWrapper>
            </motion.div>
          ))}
        </div>
        {controls}
        {HintPopup}
      </>
    );
  }

  // ============================ EDITORIAL =============================
  // Grid asimétrico tipo portada de revista: el primer ítem grande, el
  // resto chico al lado.
  if (preset === "editorial") {
    return (
      <>
        <div className="grid grid-cols-2 sm:grid-cols-3" style={{ gap: gapPx * 0.75 }}>
          {visible.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className={i === 0 ? "col-span-2 row-span-2" : ""}
            >
              <ItemWrapper
                href={item.href}
                comingSoon={item.isComingSoon}
                onComingSoonClick={() => openHint(item)}
                style={{ minHeight: (i === 0 ? 220 : 100) * sizeScale }}
                className="group relative block h-full w-full overflow-hidden rounded-xl text-left"
              >
                {item.isComingSoon && <LockBadge />}
                {item.coverImageUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.coverImageUrl} loading="lazy" decoding="async"
                      alt=""
                      draggable={false}
                      onContextMenu={(e) => e.preventDefault()}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div
                      className={`absolute inset-0 bg-gradient-to-t ${item.coverTextDark ? "from-white/90 via-white/15" : "from-black/85 via-black/10"} to-transparent`}
                    />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-[var(--glass-border)]" />
                )}
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <p
                    className={`font-mono text-[10px] ${item.coverImageUrl ? (item.coverTextDark ? "text-black/70" : "text-white/80") : "text-accent"}`}
                  >
                    {item.isComingSoon ? comingSoonLabel : item.code}
                  </p>
                  <h3
                    className={`font-display ${i === 0 ? "text-2xl" : "text-sm"} ${item.coverImageUrl ? (item.coverTextDark ? "text-black" : "text-white") : ""}`}
                  >
                    {item.title}
                  </h3>
                </div>
              </ItemWrapper>
            </motion.div>
          ))}
        </div>
        {HintPopup}
      </>
    );
  }

  // ============================= MARQUEE ==============================
  // Fila horizontal con el estilo visual del preset Marquee.
  if (preset === "marquee") {
    return (
      <>
        <div ref={trackRef} {...rail} className={trackClass} data-align={effectiveAlign} style={trackStyle}>
            {visible.map((item) => (
              <ItemWrapper
                key={item.id}
                href={item.href}
                comingSoon={item.isComingSoon}
                onComingSoonClick={() => openHint(item)}
                style={{ width: "var(--rail-card-width)" }}
                className={`${cardBg} group/card relative block shrink-0 snap-start overflow-hidden rounded-2xl p-5 text-left ${cardShadow}`}
              >
                {item.isComingSoon && <LockBadge />}
                {item.coverImageUrl && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.coverImageUrl} loading="lazy" decoding="async"
                      alt=""
                      draggable={false}
                      onContextMenu={(e) => e.preventDefault()}
                      className="absolute inset-0 h-full w-full object-cover opacity-70 transition-opacity group-hover/card:opacity-90"
                    />
                    <div
                      className={`absolute inset-0 bg-gradient-to-t ${item.coverTextDark ? "from-white/85" : "from-black/80"} to-transparent`}
                    />
                  </>
                )}
                <span
                  className={`relative font-mono text-[11px] ${item.coverImageUrl ? (item.coverTextDark ? "text-black/70" : "text-white/80") : "text-accent"}`}
                >
                  {item.isComingSoon ? comingSoonLabel : item.code}
                </span>
                <h3
                  className={`relative mt-1 font-display text-lg ${item.coverImageUrl ? (item.coverTextDark ? "text-black" : "text-white") : ""}`}
                >
                  {item.title}
                </h3>
              </ItemWrapper>
            ))}
        </div>
        {controls}
        {HintPopup}
      </>
    );
  }

  // =============================== SPLIT ===============================
  // Imagen arriba / panel de color abajo con el título — al hover el
  // panel "sube" como una cortina y revela el subtítulo.
  if (preset === "split") {
    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: gapPx }}>
          {visible.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <ItemWrapper
                href={item.href}
                comingSoon={item.isComingSoon}
                onComingSoonClick={() => openHint(item)}
                className={`group relative block overflow-hidden rounded-2xl text-left ${effectiveAlign === "center" ? "mx-auto" : effectiveAlign === "right" ? "ml-auto" : ""}`}
                style={{ width: `${Math.min(100, 100 * sizeScale)}%` }}
              >
                {item.isComingSoon && <LockBadge />}
                <div className="relative aspect-square w-full overflow-hidden">
                  {item.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.coverImageUrl} loading="lazy" decoding="async"
                      alt=""
                      draggable={false}
                      onContextMenu={(e) => e.preventDefault()}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[var(--glass-border)]">
                      <span className="font-display text-3xl text-[var(--ink-muted)]">{item.code.replace("SC-", "")}</span>
                    </div>
                  )}
                </div>
                <div className="relative -mt-6 rounded-t-2xl bg-[var(--accent)] p-4 text-[var(--bg)] transition-transform duration-300 group-hover:-translate-y-2">
                  <p className="font-mono text-[10px] opacity-70">{item.isComingSoon ? comingSoonLabel : item.code}</p>
                  <h3 className="font-display text-lg">{item.title}</h3>
                  {item.subtitle && !item.isComingSoon && (
                    <p className="mt-1 max-h-0 overflow-hidden text-xs opacity-0 transition-all duration-300 group-hover:max-h-8 group-hover:opacity-80">
                      {item.subtitle}
                    </p>
                  )}
                </div>
              </ItemWrapper>
            </motion.div>
          ))}
        </div>
        {HintPopup}
      </>
    );
  }

  // ============================= POLAROID ==============================
  // Fotos superpuestas rotadas al azar (determinístico), se enderezan y
  // agrandan al hover — pila de fotos física.
  if (preset === "polaroid") {
    return (
      <>
        <style>{`
          .djez-polaroid {
            transform: rotate(var(--rot, 0deg));
            transition: transform 0.3s ease;
          }
          .djez-polaroid:hover {
            transform: rotate(0deg) scale(1.1);
            z-index: 50;
          }
        `}</style>
        <div className={`flex flex-wrap py-4 ${alignFlex}`} style={{ columnGap: gapPx / 4, rowGap: gapPx * 2.5 }}>
          {visible.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              style={{ marginLeft: i === 0 ? 0 : -28 * sizeScale, zIndex: i }}
            >
              <ItemWrapper
                href={item.href}
                comingSoon={item.isComingSoon}
                onComingSoonClick={() => openHint(item)}
                style={{ "--rot": `${pseudoRotation(i)}deg`, width: 150 * sizeScale } as React.CSSProperties}
                className="djez-polaroid group relative block rounded-sm bg-white p-2 pb-8 text-left shadow-[0_8px_20px_rgba(0,0,0,0.25)]"
              >
                {item.isComingSoon && <LockBadge />}
                <div className="relative aspect-square w-full overflow-hidden bg-black/10">
                  {item.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.coverImageUrl} loading="lazy" decoding="async" alt="" draggable={false} onContextMenu={(e) => e.preventDefault()} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="font-display text-2xl text-black/30">{item.code.replace("SC-", "")}</span>
                    </div>
                  )}
                </div>
                <p className="mt-2 truncate text-center font-display text-sm text-black">
                  {item.isComingSoon ? "🔒" : item.title}
                </p>
              </ItemWrapper>
            </motion.div>
          ))}
        </div>
        {HintPopup}
      </>
    );
  }

  // ============================== CARDS ================================
  // Default: el diseño original.
  return (
    <>
      <div className="relative">
        <div
          ref={trackRef} {...rail}
          className={trackClass}
          data-align={effectiveAlign}
          style={trackStyle}
        >
          {visible.map((item, i) => (
            <motion.div
              key={item.id}
              className="shrink-0 snap-start"
              initial={{ opacity: 0, scale: 0.94 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
            >
              <ItemWrapper
                href={item.href}
                comingSoon={item.isComingSoon}
                onComingSoonClick={() => openHint(item)}
                style={{ width: "var(--rail-card-width)", minHeight: item.coverImageUrl && !item.isComingSoon ? 220 * sizeScale : undefined }}
                className={`${cardBg} group relative block overflow-hidden rounded-2xl p-6 text-left ${cardShadow} ${item.coverImageUrl && !item.isComingSoon ? "flex flex-col justify-end" : ""}`}
              >
                {item.isComingSoon && <LockBadge />}
                {item.coverImageUrl && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.coverImageUrl} loading="lazy" decoding="async"
                      alt=""
                      draggable={false}
                      onContextMenu={(e) => e.preventDefault()}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div
                      className={`absolute inset-0 bg-gradient-to-t ${item.coverTextDark ? "from-white/90 via-white/25" : "from-black/80 via-black/20"} to-transparent`}
                    />
                  </>
                )}
                <span
                  className={`relative font-mono text-[11px] ${item.coverImageUrl ? (item.coverTextDark ? "text-black/70" : "text-white/80") : "text-accent"}`}
                >
                  {item.isComingSoon ? comingSoonLabel : item.code}
                </span>
                <h3
                  className={`relative mt-2 font-display text-xl ${item.coverImageUrl ? (item.coverTextDark ? "text-black" : "text-white") : ""}`}
                >
                  {item.title}
                </h3>
                {item.subtitle && !item.isComingSoon && (
                  <p
                    className={`relative mt-1 text-sm ${item.coverImageUrl ? (item.coverTextDark ? "text-black/70" : "text-white/80") : "text-[var(--ink-muted)]"}`}
                  >
                    {item.subtitle}
                  </p>
                )}
              </ItemWrapper>
            </motion.div>
          ))}
        </div>

        {controls}
      </div>
      {HintPopup}
    </>
  );
}
