"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ComingSoonLink = {
  href: string;
  label: string;
  isComingSoon?: boolean;
  hint?: string | null;
  emphasis?: boolean;
};

/**
 * Fila de links del nav de desktop, con soporte para categorías
 * "Coming Soon": se ven grises/deshabilitadas y al tocarlas muestran un
 * popup con la pista en vez de navegar (mismo comportamiento que las
 * cards del carrusel de la home).
 */
export function NavLinksDesktop({ links }: { links: ComingSoonLink[] }) {
  const [hintOpen, setHintOpen] = useState<{ label: string; hint: string | null } | null>(null);

  return (
    <>
      {links.map((link) =>
        link.isComingSoon ? (
          <button
            key={link.href}
            type="button"
            onClick={() => setHintOpen({ label: link.label, hint: link.hint ?? null })}
            data-cursor="magnetic"
            className="shrink-0 rounded-full px-3 py-2 text-[var(--ink-muted)] opacity-50 grayscale"
          >
            {link.label} 🔒
          </button>
        ) : (
          <a
            key={link.href}
            href={link.href}
            data-cursor="magnetic"
            className={
              link.emphasis
                ? "shrink-0 rounded-full bg-[var(--accent)] px-3 py-2 text-[var(--bg)] transition-opacity hover:opacity-85"
                : "shrink-0 rounded-full px-3 py-2 text-[var(--ink-muted)] transition-colors hover:text-accent"
            }
          >
            {link.label}
          </a>
        )
      )}

      <AnimatePresence>
        {hintOpen && (
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
                Próximamente 🔒
              </p>
              <h3 className="mb-3 font-display text-lg">{hintOpen.label}</h3>
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
        )}
      </AnimatePresence>
    </>
  );
}
