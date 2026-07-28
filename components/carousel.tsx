"use client";

import { useRef } from "react";
import { motion } from "framer-motion";

export type CarouselItem = {
  id: string;
  title: string;
  subtitle?: string;
  code: string; // timecode/etiqueta tipo SC-01
};

type CarouselProps = {
  items: CarouselItem[];
  /** Rango permitido por el spec del cliente: mínimo 3, máximo 10 */
  minItems?: number;
  maxItems?: number;
};

export function Carousel({ items, minItems = 3, maxItems = 10 }: CarouselProps) {
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

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {visible.map((item, i) => (
          <motion.div
            key={item.id}
            className="glass group relative min-w-[280px] snap-start overflow-hidden rounded-2xl p-6"
            initial={{ opacity: 0, scale: 0.94 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.06 }}
            data-cursor="magnetic"
          >
            <span className="font-mono text-[11px] text-accent">{item.code}</span>
            <h3 className="mt-2 font-display text-xl">{item.title}</h3>
            {item.subtitle && (
              <p className="mt-1 text-sm text-[var(--ink-muted)]">{item.subtitle}</p>
            )}
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
