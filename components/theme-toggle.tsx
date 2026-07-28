"use client";

import { useTheme } from "./theme-provider";
import clsx from "clsx";

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    </svg>
  );
}

export function ThemeToggle() {
  const { theme, mode, setMode, setManualTheme } = useTheme();

  function toggleTheme() {
    // Tocar el ícono siempre pasa a manual y alterna el tema — así queda
    // clarísimo que se puede tocar, sin depender de leer "AUTO"/"MANUAL".
    setMode("manual");
    setManualTheme(theme === "noir" ? "neon" : "noir");
  }

  return (
    <div className="glass flex items-center gap-1 rounded-full p-1 text-xs font-mono">
      <button
        onClick={toggleTheme}
        data-cursor="magnetic"
        title={theme === "noir" ? "Cambiar a modo Neón (oscuro)" : "Cambiar a modo Noir (claro)"}
        aria-label="Cambiar tema"
        className="flex h-7 w-7 items-center justify-center rounded-full text-accent transition-transform hover:scale-110"
      >
        {theme === "noir" ? <SunIcon /> : <MoonIcon />}
      </button>

      <button
        onClick={() => setMode("auto")}
        data-cursor="magnetic"
        title="Seguir el tema de tu sistema automáticamente"
        className={clsx(
          "rounded-full px-2 py-1 transition-colors",
          mode === "auto" ? "bg-[var(--accent)] text-[var(--bg)]" : "text-[var(--ink-muted)]"
        )}
      >
        Auto
      </button>
    </div>
  );
}
