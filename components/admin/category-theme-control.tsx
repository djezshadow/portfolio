"use client";

import { useState } from "react";

export function CategoryThemeControl({
  defaultMode = "auto",
  defaultTheme = "noir",
}: {
  defaultMode?: string;
  defaultTheme?: string;
}) {
  const [mode, setMode] = useState(defaultMode);

  return (
    <div className="glass space-y-3 rounded-2xl p-4">
      <p className="font-mono text-xs text-[var(--ink-muted)]">Tema de esta categoría</p>
      <div className="flex gap-4 font-mono text-sm">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="themeMode"
            value="auto"
            checked={mode === "auto"}
            onChange={() => setMode("auto")}
          />
          Automático (sigue el tema global)
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="themeMode"
            value="manual"
            checked={mode === "manual"}
            onChange={() => setMode("manual")}
          />
          Manual
        </label>
      </div>

      {mode === "manual" && (
        <select
          name="themeName"
          defaultValue={defaultTheme}
          className="rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2 font-mono text-sm"
        >
          <option value="noir">Noir (claro)</option>
          <option value="neon">Neón (oscuro)</option>
        </select>
      )}
    </div>
  );
}
