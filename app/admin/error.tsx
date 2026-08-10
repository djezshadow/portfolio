"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-display text-2xl">Algo falló</h1>
      <p className="font-mono text-xs text-[var(--ink-muted)]">
        {error.message || "Error desconocido"}
      </p>
      <p className="font-mono text-[11px] text-[var(--ink-muted)]">
        Tip: si acabás de agregar un campo nuevo a la base, puede que falte correr
        <code className="mx-1 rounded bg-black/20 px-1">npx prisma db push</code>.
      </p>
      <button
        onClick={reset}
        data-cursor="magnetic"
        className="rounded-full bg-[var(--accent)] px-5 py-2 font-mono text-sm text-[var(--bg)]"
      >
        Reintentar
      </button>
    </div>
  );
}
