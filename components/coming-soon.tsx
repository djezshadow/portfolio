"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Dict = {
  comingSoon: { label: string; hint: string };
};

const REVEAL_AT = 6; // como las 6 aspas del diafragma del watermark — guiño intencional

export function ComingSoon({ hint, dict }: { hint?: string | null; dict: Dict }) {
  const [clicks, setClicks] = useState(0);
  const revealed = clicks >= REVEAL_AT;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <motion.button
        data-cursor="magnetic"
        onClick={() => setClicks((c) => Math.min(c + 1, REVEAL_AT))}
        whileTap={{ scale: 0.94 }}
        animate={{ rotate: clicks * 12 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        className="glass flex h-40 w-40 items-center justify-center rounded-full font-display text-6xl"
        aria-label="?"
      >
        ?
      </motion.button>

      <p className="font-mono text-xs uppercase tracking-widest text-[var(--ink-muted)]">
        {dict.comingSoon.label}
      </p>

      <AnimatePresence mode="wait">
        {revealed ? (
          <motion.p
            key="hint"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-sm font-display text-xl text-accent"
          >
            {hint || dict.comingSoon.hint}
          </motion.p>
        ) : (
          <motion.p
            key="counter"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-mono text-[11px] text-[var(--ink-muted)]"
          >
            {clicks}/{REVEAL_AT}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
