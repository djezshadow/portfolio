"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";

/**
 * Elemento firma de la web: en vez de un progress bar genérico,
 * el scroll de la página se lee como un timecode SMPTE (HH:MM:SS:FF),
 * como si el visitante estuviera "reproduciendo" el portfolio.
 * A 24fps, coherente con el mundo del cine.
 */
function scrollToTimecode(progress: number, totalSeconds = 180) {
  const totalFrames = Math.floor(progress * totalSeconds * 24);
  const ff = totalFrames % 24;
  const totalSecs = Math.floor(totalFrames / 24);
  const ss = totalSecs % 60;
  const mm = Math.floor(totalSecs / 60) % 60;
  const hh = Math.floor(totalSecs / 3600);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(hh)}:${pad(mm)}:${pad(ss)}:${pad(ff)}`;
}

// Total de fotogramas del "reel" completo, a 24fps — mismo criterio que
// usa scrollToTimecode para el timecode. En modo fotogramas mostramos el
// número absoluto en vez de convertirlo a HH:MM:SS:FF.
const TOTAL_SECONDS = 180;
const TOTAL_FRAMES = TOTAL_SECONDS * 24;

export function TimecodeBar() {
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const [display, setDisplay] = useState("00:00:00:00");
  const [frame, setFrame] = useState(0);
  // Pendiente del PDF: "que pueda cambiarse de timeline a fotogramas" —
  // alterna entre timecode SMPTE (HH:MM:SS:FF) y un contador de
  // fotogramas absolutos sobre el total del "reel" de la página.
  const [mode, setMode] = useState<"timecode" | "frames">("timecode");

  useEffect(() => {
    return smoothProgress.on("change", (v) => {
      setDisplay(scrollToTimecode(v));
      setFrame(Math.min(TOTAL_FRAMES, Math.floor(v * TOTAL_FRAMES)));
    });
  }, [smoothProgress]);

  const playheadX = useTransform(smoothProgress, [0, 1], ["0%", "100%"]);

  return (
    <div className="glass glass-distort fixed inset-x-0 top-0 z-50 flex items-center gap-4 px-5 py-2">
      <button
        type="button"
        onClick={() => setMode((m) => (m === "timecode" ? "frames" : "timecode"))}
        data-cursor="magnetic"
        className="shrink-0 font-mono text-[11px] text-accent"
        aria-label="Cambiar entre timecode y fotogramas"
        title="Tocar para cambiar entre timecode y fotogramas"
      >
        {mode === "timecode" ? display : `FR ${String(frame).padStart(5, "0")}/${TOTAL_FRAMES}`}
      </button>

      <div className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-[var(--glass-border)]">
        {/* marcas tipo film-strip cada 5% */}
        <div className="absolute inset-0 flex justify-between opacity-40">
          {Array.from({ length: 20 }).map((_, i) => (
            <span key={i} className="h-full w-px bg-[var(--ink-muted)]" />
          ))}
        </div>
        <motion.div
          className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full"
          style={{ left: playheadX, background: "var(--accent)" }}
        />
      </div>
    </div>
  );
}
