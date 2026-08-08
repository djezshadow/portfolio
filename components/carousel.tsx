"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import clsx from "clsx";

export type CarouselItem = {
  id: string;
  title: string;
  subtitle?: string;
  code: string; // timecode/etiqueta tipo SC-01
  href?: string;
  /// Portada opcional (item #17) — si está, se muestra de fondo en el
  /// preset "cards" y como imagen en el círculo del preset "stack".
  coverImageUrl?: string | null;
};

export type CarouselPreset = "cards" | "minimal" | "stack";

type CarouselProps = {
  items: CarouselItem[];
  /** Rango permitido por el spec del cliente: mínimo 3, máximo 10 */
  minItems?: number;
  maxItems?: number;
  preset?: CarouselPreset;
};

function ItemWrapper({
  href,
  className,
  children,
}: {
  href?: string;
  className?: string;
  children: React.ReactNode;
}) {
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

export function Carousel({ items, minItems = 3, maxItems = 10, preset = "cards" }: CarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  if (items.length < minItems) {
    console.warn(
      `Carousel: se requieren al menos ${minItems} ítems para mostrarse (recibidos: ${items.length}).`
    );
    return null;
  }

  const visible = items.slice(0, maxItems);

  const scrollBy = (dir: 1 | -1) => {
    trackRef.current?.scrollBy({ left: dir * 340, behavior: "smooth" });
  };

  // --- Preset "minimal": lista vertical de filas, sin cards grandes ---
  if (preset === "minimal") {
    return (
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
              className="flex items-center justify-between gap-4 py-4 transition-colors hover:text-accent"
            >
              <div className="flex items-center gap-4">
                <span className="font-mono text-[11px] text-accent">{item.code}</span>
                <h3 className="font-display text-lg">{item.title}</h3>
              </div>
              {item.subtitle && (
                <span className="font-mono text-xs text-[var(--ink-muted)]">{item.subtitle}</span>
              )}
            </ItemWrapper>
          </motion.div>
        ))}
      </div>
    );
  }

  // --- Preset "stack": círculos superpuestos tipo avatar-stack, título abajo ---
  if (preset === "stack") {
    return (
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
            <ItemWrapper href={item.href} className="flex flex-col items-center gap-2 text-center">
              <span
                className="glass relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full font-display text-lg"
                style={{ zIndex: visible.length - i }}
              >
                {item.coverImageUrl ? (
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
    );
  }

  // --- Preset "cards" (default): el diseño original ---
  return (
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
              className={`glass group relative block min-w-[280px] snap-start overflow-hidden rounded-2xl p-6 ${item.coverImageUrl ? "flex min-h-[220px] flex-col justify-end" : ""}`}
            >
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
                {item.code}
              </span>
              <h3 className={`relative mt-2 font-display text-xl ${item.coverImageUrl ? "text-white" : ""}`}>
                {item.title}
              </h3>
              {item.subtitle && (
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
  );
}
