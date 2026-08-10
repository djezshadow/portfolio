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
  /// Portada opcional (item #17) — si está, se muestra de fondo en el
  /// preset "cards" y como imagen en el círculo del preset "stack".
  coverImageUrl?: string | null;
  /// Coming soon (rediseño): la card se ve gris/bloqueada y al tocarla
  /// muestra un popup con `hint` en vez de navegar.
  isComingSoon?: boolean;
  hint?: string | null;
};

export type CarouselPreset = "cards" | "minimal" | "stack";

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
  children,
}: {
  href?: string;
  comingSoon?: boolean;
  onComingSoonClick?: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  if (comingSoon) {
    return (
      <button
        type="button"
        onClick={onComingSoonClick}
        data-cursor="magnetic"
        className={`${className} grayscale opacity-60 saturate-0 transition-opacity hover:opacity-75`}
      >
        {children}
      </button>
    );
  }
  if (href) {
    return (
      <Link href={href} data-cursor="magnetic" className={className}>
        {children}
      </Link>
    );
  }
  return (
    <div data-cursor="magnetic" className={className}>
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

export function Carousel({
  items,
  maxItems = 10,
  preset = "cards",
  comingSoonLabel = "Próximamente",
}: CarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [hintOpen, setHintOpen] = useState<{ title: string; hint: string | null } | null>(null);

  // Con 0 categorías no hay nada que mostrar. Con 1 o más, se muestran
  // todas — nunca se esconde la sección entera por tener "pocas" (eso
  // causó que el carrusel entero desapareciera de la home con solo 1-2
  // categorías cargadas).
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

  // --- Preset "minimal": lista vertical de filas, sin cards grandes ---
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

  // --- Preset "stack": círculos superpuestos tipo avatar-stack, título abajo ---
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

  // --- Preset "cards" (default): el diseño original ---
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
