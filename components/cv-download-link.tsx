"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function CvDownloadLink({
  href,
  label,
  className,
  locale = "es",
}: {
  href: string;
  label: string;
  className?: string;
  locale?: "es" | "en";
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" data-cursor="magnetic" onClick={() => setOpen(true)} className={className}>
        {label}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[210] flex items-center justify-center bg-black/60 p-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              onClick={(e) => e.stopPropagation()}
              className="nav-surface max-w-xs rounded-2xl p-6 text-center"
            >
              <h3 className="mb-2 font-display text-lg">
                {locale === "en" ? "Download CV?" : "¿Descargar el CV?"}
              </h3>
              <p className="mb-4 text-sm text-[var(--ink-muted)]">
                {locale === "en"
                  ? "You're about to download a PDF file."
                  : "Estás por descargar un archivo PDF."}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setOpen(false)}
                  data-cursor="magnetic"
                  className="flex-1 rounded-full border border-[var(--glass-border)] py-2 font-mono text-xs"
                >
                  {locale === "en" ? "Cancel" : "Cancelar"}
                </button>
                <a
                  href={href}
                  onClick={() => setOpen(false)}
                  data-cursor="magnetic"
                  className="flex-1 rounded-full bg-[var(--accent)] py-2 font-mono text-xs text-[var(--bg)]"
                >
                  {locale === "en" ? "Download" : "Descargar"}
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
