"use client";

import { useState } from "react";
import { inspectBlobStorage, removeLegacyOriginals } from "@/app/admin/configuracion/blob-cleanup-actions";

const megabytes = (bytes: number) => `${(bytes / 1_000_000).toLocaleString("es-AR", { maximumFractionDigits: 2 })} MB`;

export function BlobCleanup() {
  const [report, setReport] = useState<Awaited<ReturnType<typeof inspectBlobStorage>> | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const candidates = report?.candidates ?? [];
  const selectedBytes = candidates.reduce((sum, candidate) => sum + (selected.includes(candidate.pathname) ? candidate.size : 0), 0);

  async function run(remove = false) {
    if (remove && !window.confirm(`¿Eliminar permanentemente ${selected.length} archivos (${megabytes(selectedBytes)}) de Vercel Blob? Confirmá que tampoco usás sus enlaces fuera del portfolio.`)) return;
    setBusy(true);
    setMessage("");
    try {
      if (remove) {
        const result = await removeLegacyOriginals(selected);
        setMessage(`Eliminados ${result.count} archivos. Espacio liberado: ${megabytes(result.bytes)}.`);
        setReport(null);
        setSelected([]);
      }
      setReport(await inspectBlobStorage());
      setSelected([]);
    } catch {
      setMessage((previous) => `${previous} No se pudo completar la consulta. Volvé a analizar el almacenamiento.`.trim());
    } finally {
      setBusy(false);
    }
  }

  return <section className="glass space-y-3 rounded-2xl p-5">
    <h3 className="font-mono text-sm text-accent">Archivos sin usar en Vercel Blob</h3>
    <p className="text-sm text-[var(--ink-muted)]">
      Busca originales antiguos con un WebP equivalente y cargas de proyectos sin usar de más de siete días. Solo lista archivos sin referencias en la base del portfolio.
      Revisá los archivos antes de elegir cuáles borrar.
    </p>
    <button type="button" disabled={busy} onClick={() => run()} className="glass rounded-full px-5 py-2 text-sm disabled:opacity-50">
      {busy ? "Procesando…" : "Analizar almacenamiento"}
    </button>
    {report && <>
      <p className="text-sm">Uso actual: {megabytes(report.bytes)}. Candidatos: {candidates.length} ({megabytes(candidates.reduce((sum, candidate) => sum + candidate.size, 0))}).</p>
      {!!candidates.length && <>
        <button type="button" disabled={busy} className="text-sm text-accent" onClick={() => setSelected(candidates.slice(0, 100).map(({ pathname }) => pathname))}>
          Seleccionar los {Math.min(100, candidates.length)} más pesados
        </button>
        <ul className="max-h-72 space-y-2 overflow-auto text-sm">
          {candidates.map(({ pathname, size }) => <li key={pathname}>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={selected.includes(pathname)} disabled={busy || selected.length >= 100 && !selected.includes(pathname)}
                onChange={(event) => setSelected((paths) => event.target.checked ? [...paths, pathname] : paths.filter((path) => path !== pathname))} />
              <span className="min-w-0 break-all">{pathname}</span>
              <span className="shrink-0">{megabytes(size)}</span>
            </label>
          </li>)}
        </ul>
        <button type="button" disabled={busy || !selected.length} onClick={() => run(true)} className="rounded-full bg-[var(--accent)] px-5 py-2 text-sm text-[var(--bg)] disabled:opacity-50">
          Eliminar selección ({megabytes(selectedBytes)})
        </button>
      </>}
    </>}
    {message && <p role="status" className="text-sm">{message}</p>}
  </section>;
}
