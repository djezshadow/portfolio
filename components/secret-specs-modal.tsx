"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type SpecsData = { cameras: string[]; message: string | null; messageEn: string | null };

/**
 * Pedido: "Modal manteniendo el logo" — se abre manteniendo presionado
 * el logo, con una ficha estilo specs de cámara del sitio entero. Se
 * arma con las cámaras que aparecen en los EXIF cargados a mano (item
 * #1) + un mensaje manual opcional configurable en Configuración.
 */
export function SecretSpecsModal({ open, onClose, locale }: { open: boolean; onClose: () => void; locale: string }) {
  const [data, setData] = useState<SpecsData | null>(null);
  const isEn = locale === "en";

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch("/api/secret-specs")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setData({ cameras: [], message: null, messageEn: null });
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const message = (isEn ? data?.messageEn : data?.message) || data?.message || data?.messageEn;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[220] flex items-center justify-center bg-black/70 p-6"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="nav-surface w-full max-w-sm rounded-2xl p-6"
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
                {isEn ? "Camera report" : "Reporte de cámara"}
              </p>
            </div>

            <h3 className="mb-3 font-display text-xl">DJEZSHADOW</h3>

            {data === null ? (
              <p className="font-mono text-xs text-[var(--ink-muted)]">
                {isEn ? "Loading…" : "Cargando…"}
              </p>
            ) : (
              <div className="space-y-3">
                {message && <p className="text-sm leading-relaxed text-[var(--ink-muted)]">{message}</p>}

                {data.cameras.length > 0 && (
                  <div>
                    <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-[var(--ink-muted)]">
                      {isEn ? "Shot with" : "Filmado con"}
                    </p>
                    <ul className="space-y-0.5 font-mono text-xs">
                      {data.cameras.map((cam) => (
                        <li key={cam}>· {cam}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {!message && data.cameras.length === 0 && (
                  <p className="font-mono text-xs text-[var(--ink-muted)]">
                    {isEn
                      ? "No specs loaded yet — but you did find the secret."
                      : "Todavía no hay specs cargadas — pero igual encontraste el secreto."}
                  </p>
                )}
              </div>
            )}

            <button
              onClick={onClose}
              data-cursor="magnetic"
              className="mt-5 w-full rounded-full border border-[var(--glass-border)] py-2 font-mono text-xs"
            >
              {isEn ? "Close" : "Cerrar"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
