"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

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

type CarouselProps = {
  items: CarouselItem[];
  /** Máximo de ítems a mostrar (no hay mínimo — con 1 alcanza) */
  maxItems?: number;
  preset?: CarouselPreset;
  comingSoonLabel?: string;
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
  if (comingSoon) {
    return (
      <button
        type="button"
        onClick={onComingSoonClick}
        data-cursor="magnetic"
        style={style}
        className={`${className} grayscale opacity-60 saturate-0 transition-opacity hover:opacity-75`}
      >
        {children}
      </button>
    );
  }
  if (href) {
    return (
      <Link href={href} data-cursor="magnetic" style={style} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <div data-cursor="magnetic" style={style} className={className}>
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
}: CarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [hintOpen, setHintOpen] = useState<{ title: string; hint: string | null } | null>(null);

  // Con 0 categorías no hay nada que mostrar. Con 1 o más, se muestran
  // todas — nunca se esconde la sección entera por tener "pocas".
  if (items.length === 0) return null;

  const visible = items.slice(0, maxItems);

  const scrollBy = (dir: 1 | -1) => {
    trackRef.current?.scrollBy({ left: dir * 340, behavior: "smooth" });
  };

  function openHint(item: CarouselItem) {
    setHintOpen({ title: item.title, hint: item.hint ?? null });
  }

  const HintPopup = hintOpen && (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setHintOpen(null)}
        className="fixed inset-0 z-[210] flex items-center justify-center bg-black/60 p-6"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.94 }}
          onClick={(e) => e.stopPropagation()}
          className="nav-surface max-w-xs rounded-2xl p-6 text-center"
        >
          <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-accent">
            {comingSoonLabel} 🔒
          </p>
          <h3 className="mb-3 font-display text-lg">{hintOpen.title}</h3>
          {hintOpen.hint && <p className="text-sm text-[var(--ink-muted)]">{hintOpen.hint}</p>}
          <button
            onClick={() => setHintOpen(null)}
            data-cursor="magnetic"
            className="mt-4 rounded-full bg-[var(--accent)] px-4 py-1.5 font-mono text-xs text-[var(--bg)]"
          >
            Cerrar
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
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
        <div className="flex flex-wrap gap-x-2 gap-y-6">
          {visible.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              style={{ marginLeft: i === 0 ? 0 : -16 }}
            >
              <ItemWrapper
                href={item.href}
                comingSoon={item.isComingSoon}
                onComingSoonClick={() => openHint(item)}
                className="flex flex-col items-center gap-2 text-center"
              >
                <span
                  className="glass relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full font-display text-lg"
                  style={{ zIndex: visible.length - i }}
                >
                  {item.isComingSoon ? (
                    "🔒"
                  ) : item.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.coverImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
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
        <div className="flex gap-3 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                className="group relative block w-[160px] shrink-0 overflow-hidden rounded-sm bg-black text-left"
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
                      src={item.coverImageUrl}
                      alt=""
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
                className={`group relative block h-full w-full overflow-hidden rounded-xl text-left ${i === 0 ? "min-h-[220px]" : "min-h-[100px]"}`}
              >
                {item.isComingSoon && <LockBadge />}
                {item.coverImageUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.coverImageUrl}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-[var(--glass-border)]" />
                )}
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <p className={`font-mono text-[10px] ${item.coverImageUrl ? "text-white/80" : "text-accent"}`}>
                    {item.isComingSoon ? comingSoonLabel : item.code}
                  </p>
                  <h3 className={`font-display ${i === 0 ? "text-2xl" : "text-sm"} ${item.coverImageUrl ? "text-white" : ""}`}>
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
  // Loop horizontal automático, se pausa al pasar el mouse.
  if (preset === "marquee") {
    const loopItems = [...visible, ...visible];
    const duration = Math.max(visible.length * 4, 16);
    return (
      <>
        <style>{`
          @keyframes djez-marquee {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
          .djez-marquee-track {
            animation: djez-marquee var(--marquee-duration, 20s) linear infinite;
          }
          .djez-marquee-track:hover {
            animation-play-state: paused;
          }
        `}</style>
        <div className="overflow-hidden">
          <div
            className="djez-marquee-track flex w-max gap-4"
            style={{ "--marquee-duration": `${duration}s` } as React.CSSProperties}
          >
            {loopItems.map((item, i) => (
              <ItemWrapper
                key={`${item.id}-${i}`}
                href={item.href}
                comingSoon={item.isComingSoon}
                onComingSoonClick={() => openHint(item)}
                className="glass group/card relative block min-w-[240px] shrink-0 overflow-hidden rounded-2xl p-5 text-left shadow-none"
              >
                {item.isComingSoon && <LockBadge />}
                {item.coverImageUrl && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.coverImageUrl}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover opacity-70 transition-opacity group-hover/card:opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  </>
                )}
                <span className={`relative font-mono text-[11px] ${item.coverImageUrl ? "text-white/80" : "text-accent"}`}>
                  {item.isComingSoon ? comingSoonLabel : item.code}
                </span>
                <h3 className={`relative mt-1 font-display text-lg ${item.coverImageUrl ? "text-white" : ""}`}>
                  {item.title}
                </h3>
              </ItemWrapper>
            ))}
          </div>
        </div>
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                className="group relative block overflow-hidden rounded-2xl text-left"
              >
                {item.isComingSoon && <LockBadge />}
                <div className="relative aspect-square w-full overflow-hidden">
                  {item.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.coverImageUrl}
                      alt=""
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
        <div className="flex flex-wrap justify-center gap-x-1 gap-y-10 py-4">
          {visible.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              style={{ marginLeft: i === 0 ? 0 : -28, zIndex: i }}
            >
              <ItemWrapper
                href={item.href}
                comingSoon={item.isComingSoon}
                onComingSoonClick={() => openHint(item)}
                style={{ "--rot": `${pseudoRotation(i)}deg` } as React.CSSProperties}
                className="djez-polaroid group relative block w-[150px] rounded-sm bg-white p-2 pb-8 text-left shadow-[0_8px_20px_rgba(0,0,0,0.25)]"
              >
                {item.isComingSoon && <LockBadge />}
                <div className="relative aspect-square w-full overflow-hidden bg-black/10">
                  {item.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.coverImageUrl} alt="" className="h-full w-full object-cover" />
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
          ref={trackRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {visible.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.94 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
            >
              <ItemWrapper
                href={item.href}
                comingSoon={item.isComingSoon}
                onComingSoonClick={() => openHint(item)}
                className={`glass group relative block min-w-[280px] snap-start overflow-hidden rounded-2xl p-6 text-left shadow-none ${item.coverImageUrl && !item.isComingSoon ? "flex min-h-[220px] flex-col justify-end" : ""}`}
              >
                {item.isComingSoon && <LockBadge />}
                {item.coverImageUrl && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.coverImageUrl}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  </>
                )}
                <span className={`relative font-mono text-[11px] ${item.coverImageUrl ? "text-white/80" : "text-accent"}`}>
                  {item.isComingSoon ? comingSoonLabel : item.code}
                </span>
                <h3 className={`relative mt-2 font-display text-xl ${item.coverImageUrl ? "text-white" : ""}`}>
                  {item.title}
                </h3>
                {item.subtitle && !item.isComingSoon && (
                  <p className={`relative mt-1 text-sm ${item.coverImageUrl ? "text-white/80" : "text-[var(--ink-muted)]"}`}>
                    {item.subtitle}
                  </p>
                )}
              </ItemWrapper>
            </motion.div>
          ))}
        </div>

        <div className="mt-3 flex justify-end gap-2">
          <button
            onClick={() => scrollBy(-1)}
            data-cursor="magnetic"
            className="glass h-9 w-9 rounded-full font-mono text-sm"
            aria-label="Anterior"
          >
            ←
          </button>
          <button
            onClick={() => scrollBy(1)}
            data-cursor="magnetic"
            className="glass h-9 w-9 rounded-full font-mono text-sm"
            aria-label="Siguiente"
          >
            →
          </button>
        </div>
      </div>
      {HintPopup}
    </>
  );
}
