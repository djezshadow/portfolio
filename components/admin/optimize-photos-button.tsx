"use client";

import { useState } from "react";
import { optimizeExistingPhotos, type OptimizeResult } from "@/app/admin/configuracion/optimize-actions";

export function OptimizePhotosButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizeResult | null>(null);

  async function handleClick() {
    setLoading(true);
    setResult(null);
    try {
      const res = await optimizeExistingPhotos();
      setResult(res);
    } catch (err) {
      setResult({ ok: false, processed: 0, skipped: 0, error: err instanceof Error ? err.message : String(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass space-y-3 rounded-2xl p-5">
      <p className="font-mono text-xs text-accent">Optimizar fotos ya subidas</p>
      <p className="font-mono text-[11px] text-[var(--ink-muted)]">
        Achica a 2400px máximo el original si venía más grande, y vuelve a hornear la versión
        pública de cada foto con el watermark actual ya IMPRESO adentro (no se calcula en cada
        visita), comprimida en WebP para que pese menos y cargue más rápido. Las fotos nuevas ya
        se suben así solas — este botón es para ponerte al día con las que ya estaban antes, o
        después de cambiar posición/opacidad/logo del watermark en la sección de arriba. Puede
        tardar un rato si tenés muchas fotos — no hace falta que te quedes mirando, podés navegar
        a otro lado mientras corre.
      </p>
      <button
        onClick={handleClick}
        disabled={loading}
        data-cursor="magnetic"
        className="rounded-full bg-[var(--accent)] px-5 py-2 font-mono text-xs text-[var(--bg)] disabled:opacity-50"
      >
        {loading ? "Optimizando…" : "Optimizar ahora"}
      </button>

      {result && (
        <p className="font-mono text-[11px] text-[var(--ink-muted)]">
          {result.ok
            ? `Listo: ${result.processed} foto(s) optimizada(s), ${result.skipped} ya estaban bien.`
            : `Error: ${result.error}`}
        </p>
      )}
    </div>
  );
}
