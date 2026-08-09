"use client";

import { useState } from "react";
import { bakeWatermarkForAllPhotos, type BakeResult } from "@/app/admin/configuracion/bake-watermark-actions";

export function BakeWatermarkButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BakeResult | null>(null);

  async function handleClick() {
    if (
      !confirm(
        "Esto reprocesa TODAS las fotos con la configuración de watermark actual y reemplaza las versiones públicas anteriores. Puede tardar varios minutos si tenés muchas fotos. ¿Continuar?"
      )
    ) {
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await bakeWatermarkForAllPhotos();
      setResult(res);
    } catch (err) {
      setResult({ ok: false, processed: 0, failed: 0, error: err instanceof Error ? err.message : String(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass space-y-3 rounded-2xl p-5">
      <p className="font-mono text-xs text-accent">Aplicar marca de agua a todas las fotos</p>
      <p className="font-mono text-[11px] text-[var(--ink-muted)]">
        Vuelve a generar la versión pública de cada foto (con el watermark ya HORNEADO adentro,
        no calculado en cada visita) usando la posición/opacidad/logo de acá arriba. Las fotos
        nuevas que subas de acá en más ya se hornean solas al subirlas — este botón es para
        cuando cambiás algo de la config y querés que se refleje en las que ya estaban.
        El archivo original (sin marca) queda guardado aparte, así que podés repetir esto las
        veces que quieras sin perder calidad.
      </p>
      <button
        onClick={handleClick}
        disabled={loading}
        data-cursor="magnetic"
        className="rounded-full bg-[var(--accent)] px-5 py-2 font-mono text-xs text-[var(--bg)] disabled:opacity-50"
      >
        {loading ? "Procesando… no cierres esta página" : "Aplicar ahora"}
      </button>

      {result && (
        <p className="font-mono text-[11px] text-[var(--ink-muted)]">
          {result.ok
            ? `Listo: ${result.processed} foto(s) actualizada(s)${result.failed ? `, ${result.failed} con error (revisá los logs)` : ""}.`
            : `Error: ${result.error}`}
        </p>
      )}
    </div>
  );
}
