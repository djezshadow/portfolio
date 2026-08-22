"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

/**
 * Pedido: código Konami → popup lateral estilo logro de Steam
 * ("Descubriste mi secreto"), bilingüe. Escucha teclas globalmente;
 * en mobile no hay forma natural de tipear flechas, así que este
 * easter egg queda pensado para desktop (el logo mantenido-presionado
 * cubre el equivalente en mobile).
 */
export function KonamiEasterEgg({ locale }: { locale: string }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const isEn = locale === "en";
  const defaultMessage = isEn ? "You found my secret" : "Descubriste mi secreto";

  useEffect(() => {
    let progress = 0;
    let hideTimer: ReturnType<typeof setTimeout>;
    let checking = false;

    async function trigger() {
      // Evita que si alguien vuelve a tipear la secuencia mientras el
      // primer chequeo todavía está en vuelo, se disparen dos requests.
      if (checking) return;
      checking = true;
      try {
        const res = await fetch("/api/konami-check", { method: "POST" });
        if (!res.ok) return;
        const data = await res.json();
        // Pedido: "por IP solo salga una vez" — si el server dice que
        // esta IP ya lo vio antes, no se muestra de nuevo.
        if (data.alreadySeen) return;

        const custom = isEn ? data.messageEn : data.message;
        setMessage((custom || data.message || data.messageEn || "").trim() || null);
        setVisible(true);
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => setVisible(false), 5000);

        // El navegador elige automáticamente qué formato reproducir
        // (MP3/AAC/OGG) según el archivo que se haya subido — no hace
        // falta detectar nada a mano. Se dispara dentro del mismo ciclo
        // de eventos que la tecla que completó el código, así que los
        // navegadores lo dejan sonar (todavía cuenta como gesto del
        // usuario) aunque haya pasado por un fetch en el medio.
        if (data.soundUrl) {
          try {
            const audio = new Audio(data.soundUrl);
            audio.volume = 0.6;
            void audio.play().catch(() => {
              // Si el navegador igual lo bloquea, no rompemos nada — el
              // logro visual se muestra igual.
            });
          } catch {
            // ignorar
          }
        }
      } catch {
        // silencioso — es un detalle ambiental, no algo crítico
      } finally {
        checking = false;
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === KONAMI[progress]) {
        progress += 1;
        if (progress === KONAMI.length) {
          progress = 0;
          trigger();
        }
      } else {
        // Reinicia, salvo que la tecla actual también sea el primer
        // paso de la secuencia (para no perder un reintento inmediato).
        progress = key === KONAMI[0] ? 1 : 0;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      clearTimeout(hideTimer);
    };
  }, [isEn]);

  return (
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
  );
}
