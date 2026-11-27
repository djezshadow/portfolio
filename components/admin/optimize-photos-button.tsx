"use client";

import { useState } from "react";
import { optimizeExistingPhotos, refreshPhotoWatermarks, type OptimizeResult } from "@/app/admin/configuracion/optimize-actions";

export function OptimizePhotosButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [watermarks, setWatermarks] = useState(false);

  async function handleClick(refresh: boolean) {
    if (!refresh && !window.confirm("Se reemplazarán las fotos compatibles por WebP de hasta 2400 px y se borrarán sus originales del almacenamiento. ¿Continuar?")) return;
    setWatermarks(refresh);
    setLoading(true);
    const totals: OptimizeResult = { converted: 0, deleted: 0, skipped: 0, errors: [], cursor: null };
    setResult(totals);
    try {
      do {
        const batch = await (refresh ? refreshPhotoWatermarks : optimizeExistingPhotos)(totals.cursor);
        totals.converted += batch.converted;
        totals.deleted += batch.deleted;
        totals.skipped += batch.skipped;
        totals.errors = [...totals.errors, ...batch.errors];
        totals.cursor = batch.cursor;
        setResult({ ...totals });
      } while (totals.cursor);
    } catch {
      setResult({ ...totals, errors: [...totals.errors, "El proceso se interrumpió. Podés volver a ejecutarlo."] });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass space-y-3 rounded-2xl p-5">
      <p className="font-mono text-sm text-accent">Almacenamiento de fotos</p>
      <p className="text-sm text-[var(--ink-muted)]">
        Convierte las fotos compatibles del portfolio a WebP, hasta 2400 px por lado.
        Después de guardar cada reemplazo, borra el original. Mantené abierta esta página durante la conversión.
      </p>
      <button type="button" onClick={() => handleClick(false)} disabled={loading}
        className="rounded-full bg-[var(--accent)] px-5 py-2 text-sm text-[var(--bg)] disabled:opacity-50">
        {loading && !watermarks ? "Convirtiendo…" : "Convertir todo el almacenamiento interno de fotos a WebP y eliminar originales"}
      </button>
      <button type="button" onClick={() => handleClick(true)} disabled={loading}
        className="glass ml-2 rounded-full px-5 py-2 text-sm disabled:opacity-50">
        {loading && watermarks ? "Actualizando…" : "Actualizar marcas de agua"}
      </button>
      {result && <div role="status" className="space-y-2 text-sm">
        <p>{watermarks ? `Fotos actualizadas: ${result.converted}.` : `Convertidas: ${result.converted}. Originales borrados: ${result.deleted}. Omitidas: ${result.skipped}.`}</p>
        {!!result.errors.length && <ul className="list-disc pl-5">{result.errors.map((message, i) => <li key={i}>{message}</li>)}</ul>}
      </div>}
    </div>
  );
}
