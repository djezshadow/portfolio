"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const DIRECTIONS = ["up", "up", "down", "down", "left", "right", "left", "right"] as const;
const KEYS: Record<string, (typeof DIRECTIONS)[number]> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

// Mínimo de píxeles para contar como swipe (evita que un toque suelto
// cuente como gesto), y cuánto más marcado tiene que ser un eje sobre
// el otro para no confundir diagonales.
const SWIPE_MIN_PX = 40;
const SWIPE_AXIS_RATIO = 1.4;
const SWIPE_IDLE_MS = 4500;
const LOCK_STEP = 4;

/**
 * Pedido: código Konami también en celular — las 8 flechas se hacen
 * deslizando el dedo (swipe) en cualquier parte de la pantalla; al
 * completarlas aparece un popup con botones "B" y "A" para tocar en ese
 * orden (no hay forma natural de "tipear" esas letras en mobile). En
 * desktop sigue funcionando con el teclado como antes, incluyendo las
 * teclas B/A reales.
 */
export function KonamiEasterEgg({ locale }: { locale: string }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showBA, setShowBA] = useState(false);
  const [locked, setLocked] = useState(false);
  const mobileActions = useRef<{ pressB: () => void; pressA: () => void } | null>(null);
  const isEn = locale === "en";
  const defaultMessage = isEn ? "Cut. This scene isn’t in the script." : "Corte. Esta escena no estaba en el guion.";

  useEffect(() => {
    let keyboardProgress = 0;
    let swipeProgress = 0;
    let swipeTimeout: ReturnType<typeof setTimeout>;
    let waitingForButtons = false;
    let tappedB = false;
    let disposed = false;
    let hideTimer: ReturnType<typeof setTimeout>;
    let baTimeout: ReturnType<typeof setTimeout>;
    let checking = false;

    async function trigger() {
      if (checking) return;
      checking = true;
      try {
        const res = await fetch("/api/konami-check", { method: "POST" });
        if (!res.ok) return;
        const data = await res.json();
        if (disposed || data.alreadySeen) return;

        const custom = isEn ? data.messageEn : data.message;
        setMessage((custom || data.message || data.messageEn || "").trim() || null);
        setVisible(true);
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => setVisible(false), 5000);

        if (data.soundUrl) {
          try {
            const audio = new Audio(data.soundUrl);
            audio.volume = 0.6;
            void audio.play().catch(() => {});
          } catch {
            // ignorar
          }
        }
      } catch {
        // silencioso
      } finally {
        checking = false;
      }
    }

    function setScrollLock(active: boolean) {
      document.documentElement.classList.toggle("konami-scroll-lock", active);
      setLocked(active);
    }

    function resetSwipes() {
      clearTimeout(swipeTimeout);
      swipeProgress = 0;
      setScrollLock(false);
    }

    function closeButtons() {
      clearTimeout(baTimeout);
      waitingForButtons = false;
      tappedB = false;
      setShowBA(false);
    }

    function openBAPrompt() {
      resetSwipes();
      waitingForButtons = true;
      tappedB = false;
      setShowBA(true);
      baTimeout = setTimeout(closeButtons, 8000);
    }

    mobileActions.current = {
      pressB: () => {
        if (!waitingForButtons) return;
        tappedB = true;
        clearTimeout(baTimeout);
        baTimeout = setTimeout(closeButtons, 8000);
      },
      pressA: () => {
        if (!waitingForButtons || !tappedB) return;
        closeButtons();
        void trigger();
      },
    };

    // --- Teclado (desktop) ---
    let waitingA = false;
    function onKeyDown(e: KeyboardEvent) {
      const dir = KEYS[e.key];
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

      if (keyboardProgress < DIRECTIONS.length) {
        if (dir === DIRECTIONS[keyboardProgress]) {
          keyboardProgress += 1;
        } else {
          keyboardProgress = dir === DIRECTIONS[0] ? 1 : 0;
        }
        return;
      }

      if (key === "b") {
        waitingA = true;
      } else if (key === "a" && waitingA) {
        keyboardProgress = 0;
        waitingA = false;
        trigger();
      } else {
        keyboardProgress = 0;
        waitingA = false;
      }
    }

    let start: { id: number; x: number; y: number } | null = null;

    function onTouchStart(e: TouchEvent) {
      start = null;
      if (waitingForButtons || e.touches.length !== 1) return;
      const target = e.target;
      if (!swipeProgress && target instanceof Element &&
        target.closest("dialog, [role=dialog], input, textarea, select, [contenteditable=true]")) return;
      const touch = e.changedTouches[0];
      if (touch) start = { id: touch.identifier, x: touch.clientX, y: touch.clientY };
    }

    function onTouchEnd(e: TouchEvent) {
      const origin = start;
      if (!origin) return;
      const touch = Array.from(e.changedTouches).find(({ identifier }) => identifier === origin.id);
      if (!touch) return;
      start = null;
      const dx = touch.clientX - origin.x;
      const dy = touch.clientY - origin.y;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      const distance = Math.max(absX, absY);
      if (distance < SWIPE_MIN_PX || distance < Math.min(absX, absY) * SWIPE_AXIS_RATIO) return;

      const direction = absX > absY ? dx > 0 ? "right" : "left" : dy > 0 ? "down" : "up";
      if (direction === DIRECTIONS[swipeProgress]) {
        swipeProgress++;
        if (swipeProgress === LOCK_STEP) setScrollLock(true);
        if (swipeProgress === DIRECTIONS.length) {
          openBAPrompt();
          return;
        }
      } else {
        resetSwipes();
        swipeProgress = direction === DIRECTIONS[0] ? 1 : 0;
      }
      clearTimeout(swipeTimeout);
      if (swipeProgress) swipeTimeout = setTimeout(resetSwipes, SWIPE_IDLE_MS);
    }

    function onTouchCancel() {
      start = null;
      resetSwipes();
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchCancel, { passive: true });

    return () => {
      disposed = true;
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchCancel);
      clearTimeout(swipeTimeout);
      clearTimeout(hideTimer);
      clearTimeout(baTimeout);
      document.documentElement.classList.remove("konami-scroll-lock");
      mobileActions.current = null;
    };
  }, [isEn]);

  return (
    <>
      {locked && <div aria-hidden="true" className="fixed inset-0 z-[229] touch-none overscroll-none" />}
      <div className="pointer-events-none fixed right-4 top-20 z-[230] sm:right-6 sm:top-24">
        <AnimatePresence>
          {visible && (
            <motion.div
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 80 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="nav-surface flex items-center gap-3 rounded-2xl p-3 pr-5 shadow-lg"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-lg">
                🏆
              </span>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--ink-muted)]">
                  {isEn ? "Achievement unlocked" : "Logro desbloqueado"}
                </p>
                <p className="font-display text-sm">{message || defaultMessage}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Popup B/A — pedido: "en celular debe aparecer un popup con los
          botones B y A cuando hiciste lo de las flechas deslizando". */}
      <AnimatePresence>
        {showBA && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="fixed inset-x-0 bottom-24 z-[230] flex justify-center px-4"
          >
            <div className="nav-surface flex items-center gap-4 rounded-2xl px-5 py-4 shadow-lg">
              <p className="font-mono text-[11px] text-[var(--ink-muted)]">
                {isEn ? "Now tap:" : "Ahora tocá:"}
              </p>
              <button
                type="button"
                onClick={() => mobileActions.current?.pressB()}
                data-cursor="magnetic"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent)] font-display text-lg text-[var(--bg)] active:scale-90"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => mobileActions.current?.pressA()}
                data-cursor="magnetic"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent)] font-display text-lg text-[var(--bg)] active:scale-90"
              >
                A
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
