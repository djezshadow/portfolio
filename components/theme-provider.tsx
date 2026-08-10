"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type ThemeName = "noir" | "neon";
export type ThemeMode = "manual" | "auto";

interface ThemeContextValue {
  theme: ThemeName;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  setManualTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_MODE_KEY = "djz-theme-mode";
const STORAGE_MANUAL_KEY = "djz-theme-manual";

/**
 * Reglas del sistema (definidas por el cliente):
 * - Noir = modo claro / Neón = modo oscuro. No son dos ejes separados.
 * - Global: Manual (el usuario elige) o Automático (sigue system prefers-color-scheme).
 * - Se guarda en localStorage: la próxima visita arranca con el mismo estado
 *   en el que lo dejaste, no vuelve a "auto" solo.
 * - Cada categoría (fuera de este provider, ver useCategoryTheme más abajo)
 *   puede pisar el tema global si está en "manual" a nivel categoría.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("auto");
  const [manualTheme, setManualThemeState] = useState<ThemeName>("noir");
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);

  // Restaura la última elección guardada (se corre una sola vez, al montar).
  useEffect(() => {
    const savedMode = localStorage.getItem(STORAGE_MODE_KEY) as ThemeMode | null;
    const savedManual = localStorage.getItem(STORAGE_MANUAL_KEY) as ThemeName | null;
    if (savedMode === "auto" || savedMode === "manual") setModeState(savedMode);
    if (savedManual === "noir" || savedManual === "neon") setManualThemeState(savedManual);
  }, []);

  function setMode(next: ThemeMode) {
    setModeState(next);
    localStorage.setItem(STORAGE_MODE_KEY, next);
  }

  function setManualTheme(next: ThemeName) {
    setManualThemeState(next);
    localStorage.setItem(STORAGE_MANUAL_KEY, next);
  }

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemPrefersDark(mq.matches);
    const listener = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  const theme: ThemeName = useMemo(() => {
    if (mode === "manual") return manualTheme;
    return systemPrefersDark ? "neon" : "noir";
  }, [mode, manualTheme, systemPrefersDark]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, mode, setMode, setManualTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme debe usarse dentro de <ThemeProvider>");
  return ctx;
}

/**
 * Para usar en páginas de categoría más adelante (fase 3):
 * cada categoría en la base de datos va a tener su propio
 * { mode: "manual" | "auto", theme?: "noir" | "neon" }.
 * Si mode es "auto", se ignora el override y se usa el tema global.
 */
export function resolveCategoryTheme(
  globalTheme: ThemeName,
  category: { mode: ThemeMode; theme?: ThemeName }
): ThemeName {
  if (category.mode === "manual" && category.theme) return category.theme;
  return globalTheme;
}
