"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue } from "framer-motion";

/**
 * Cursor firma: un punto chico que sigue el mouse 1:1, sin delay — el
 * spring quedó solo para el efecto de deformación al pasar sobre botones,
 * no para la posición (antes tenía inercia y se sentía con lag).
 * Usa el color de acento del tema (no mix-blend-mode: difference, que
 * genera un artefacto rectangular al cruzar bordes de paneles con
 * backdrop-filter — bug conocido de compositing en Chrome).
 * Se desactiva solo en touch y respeta prefers-reduced-motion.
 */
export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);

  const BASE = 12;

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);

  useEffect(() => {
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isTouch || reducedMotion) return;
    setEnabled(true);

    const move = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const magnetic = target.closest('[data-cursor="magnetic"]') as HTMLElement | null;

      if (magnetic) {
        const rect = magnetic.getBoundingClientRect();
        x.set(rect.left + rect.width / 2 - BASE / 2);
        y.set(rect.top + rect.height / 2 - BASE / 2);
        setHovering(true);
      } else {
        x.set(e.clientX - BASE / 2);
        y.set(e.clientY - BASE / 2);
        setHovering(false);
      }
    };

    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      className="pointer-events-none fixed left-0 top-0 z-[999] rounded-full"
      style={{
        x,
        y,
        width: BASE,
        height: BASE,
        background: "var(--accent)",
        boxShadow: "0 0 0 1px var(--bg), 0 2px 8px rgba(0,0,0,0.25)",
      }}
      animate={{
        scale: hovering ? 1.6 : 1,
        borderRadius: hovering ? "40% 60% 55% 45% / 45% 40% 60% 55%" : "50%",
      }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
    />
  );
}
