"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type ExifPick = {
  exifCamera: string | null;
  exifAperture: string | null;
  exifShutterSpeed: string | null;
  exifIso: string | null;
  exifFps: string | null;
};

const CORNERS = [
  "bottom-4 left-4 sm:bottom-6 sm:left-6",
  "bottom-4 right-4 sm:bottom-6 sm:right-6",
  "top-20 left-4 sm:top-24 sm:left-6",
  "top-20 right-4 sm:top-24 sm:right-6",
] as const;

/**
 * Pedido: "cápsula flotante aleatoria... que sea literal aleatorio pero
 * que no rompa con la estética". Reutiliza la clase `glass` del sitio
 * (mismo look que el resto de la UI), aparece en una esquina al azar
 * cada tanto, se queda unos segundos y se va — nunca en el centro, nunca
 * tapa contenido importante, nunca interrumpe (pointer-events: none).
 */
export function RandomExifCapsule() {
  const [pick, setPick] = useState<ExifPick | null>(null);
  const [corner, setCorner] = useState<(typeof CORNERS)[number]>(CORNERS[0]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let showTimer: ReturnType<typeof setTimeout>;
    let hideTimer: ReturnType<typeof setTimeout>;
    let cycleTimer: ReturnType<typeof setTimeout>;

    async function cycle() {
      try {
        const res = await fetch("/api/random-exif");
        if (res.status === 204 || !res.ok) {
          if (!cancelled) cycleTimer = setTimeout(cycle, 90_000);
          return;
        }
        const data: ExifPick = await res.json();
        if (cancelled) return;

        setPick(data);
        setCorner(CORNERS[Math.floor(Math.random() * CORNERS.length)]);

        showTimer = setTimeout(() => {
          if (cancelled) return;
          setVisible(true);
          hideTimer = setTimeout(() => {
            if (cancelled) return;
            setVisible(false);
          }, 6000);
        }, 1500);
      } catch {
        // silencioso — es un detalle ambiental, no algo crítico
      } finally {
        if (!cancelled) {
          const nextIn = 40_000 + Math.random() * 50_000; // cada 40-90s
          cycleTimer = setTimeout(cycle, nextIn);
        }
      }
    }

    // Primer aparición recién a los ~20-40s de entrar al sitio — no
    // apenas carga la página.
    cycleTimer = setTimeout(cycle, 20_000 + Math.random() * 20_000);

    return () => {
      cancelled = true;
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      clearTimeout(cycleTimer);
    };
  }, []);

  if (!pick) return null;

  const parts = [
    pick.exifCamera,
    pick.exifAperture,
    pick.exifShutterSpeed ? `${pick.exifShutterSpeed}s` : null,
    pick.exifIso ? `ISO ${pick.exifIso}` : null,
    pick.exifFps ? `${pick.exifFps}fps` : null,
  ].filter(Boolean);
  if (parts.length === 0) return null;

  return (
    <div className={`pointer-events-none fixed z-40 ${corner}`}>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.4 }}
            className="glass rounded-full px-3 py-1.5 font-mono text-[10px] text-[var(--ink-muted)]"
          >
            📷 {parts.join(" · ")}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
