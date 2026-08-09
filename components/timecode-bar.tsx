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

export function TimecodeBar() {
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const [display, setDisplay] = useState("00:00:00:00");

  useEffect(() => {
    return smoothProgress.on("change", (v) => setDisplay(scrollToTimecode(v)));
  }, [smoothProgress]);

  const playheadX = useTransform(smoothProgress, [0, 1], ["0%", "100%"]);

  return (
    <div className="glass glass-distort fixed inset-x-0 top-0 z-50 flex items-center gap-4 px-5 py-2">
      <span className="font-mono text-[11px] text-accent">{display}</span>

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
