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
  const isEn = locale === "en";
  const defaultMessage = isEn ? "You found my secret" : "Descubriste mi secreto";
  const baProgress = useRef(0); // 0 = espera B, 1 = espera A (ya tocó B)

  useEffect(() => {
    let progress = 0;
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
        if (data.alreadySeen) return;

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

    function openBAPrompt() {
      baProgress.current = 0;
      setShowBA(true);
      clearTimeout(baTimeout);
      // Si no toca B y A en unos segundos, se cancela — evita que quede
      // "colgado" esperando para siempre.
      baTimeout = setTimeout(() => setShowBA(false), 8000);
    }

    // --- Teclado (desktop) ---
    let waitingA = false;
    function onKeyDown(e: KeyboardEvent) {
      const dir = KEYS[e.key];
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

      if (progress < DIRECTIONS.length) {
        if (dir === DIRECTIONS[progress]) {
          progress += 1;
        } else {
          progress = dir === DIRECTIONS[0] ? 1 : 0;
        }
        return;
      }

      if (key === "b") {
        waitingA = true;
      } else if (key === "a" && waitingA) {
        progress = 0;
        waitingA = false;
        trigger();
      } else {
        progress = 0;
        waitingA = false;
      }
    }

    // --- Touch / swipe (mobile) ---
    let touchStartX = 0;
    let touchStartY = 0;

    function onTouchStart(e: TouchEvent) {
      const t = e.changedTouches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;
    }

    function onTouchEnd(e: TouchEvent) {
      if (showBA) return; // ya completó las flechas, está esperando B/A
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (Math.max(absX, absY) < SWIPE_MIN_PX) return; // toque, no swipe
      if (Math.max(absX, absY) < Math.min(absX, absY) * SWIPE_AXIS_RATIO) return; // demasiado diagonal

      let dir: (typeof DIRECTIONS)[number];
      if (absX > absY) dir = dx > 0 ? "right" : "left";
      else dir = dy > 0 ? "down" : "up";

      if (dir === DIRECTIONS[progress]) {
        progress += 1;
        if (progress === DIRECTIONS.length) {
          progress = 0;
          openBAPrompt();
        }
      } else {
        progress = dir === DIRECTIONS[0] ? 1 : 0;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    // Expone trigger/openBAPrompt para los botones B/A tocados en la UI.
    (window as unknown as { __djezKonamiTrigger?: () => void }).__djezKonamiTrigger = trigger;

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      clearTimeout(hideTimer);
      clearTimeout(baTimeout);
    };
  }, [isEn, showBA]);

  function tapB() {
    baProgress.current = 1;
  }
  function tapA() {
    if (baProgress.current === 1) {
      setShowBA(false);
      const trigger = (window as unknown as { __djezKonamiTrigger?: () => void }).__djezKonamiTrigger;
      trigger?.();
    } else {
      // Tocó A sin tocar B antes — reinicia el paso B/A, no hace falta
      // volver a deslizar las flechas de nuevo dentro de la ventana de
      // 8s.
      baProgress.current = 0;
    }
  }

  return (
    <>
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
                onClick={tapB}
                data-cursor="magnetic"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent)] font-display text-lg text-[var(--bg)] active:scale-90"
              >
                B
              </button>
              <button
                type="button"
                onClick={tapA}
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
