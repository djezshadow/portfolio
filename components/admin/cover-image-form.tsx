"use client";

import { useState } from "react";
import { compressImageForUpload } from "@/lib/compress-image";

export function CoverImageForm({
  action,
  currentUrl,
  label,
}: {
  action: (formData: FormData) => Promise<void>;
  currentUrl: string | null;
  label: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={async (formData: FormData) => {
        setError(null);
        const file = formData.get("image") as File | null;
        // La compresión en el navegador es la causa real detrás del error
        // "Algo falló — unexpected response" al subir portadas: Vercel
        // corta requests grandes ANTES de que lleguen a nuestro código,
        // y una foto de celular sin comprimir suele pesar varios MB.
        if (file && file.size > 0) {
          setPending(true);
          try {
            const compressed = await compressImageForUpload(file);
            formData.set("image", compressed);
          } catch {
            // seguimos con el archivo original si la compresión falla
          }
        }
        try {
          await action(formData);
        } catch (err) {
          setError(err instanceof Error ? err.message : "No se pudo guardar la portada.");
        } finally {
          setPending(false);
        }
      }}
      className="glass space-y-3 rounded-2xl p-4"
    >
      <p className="font-mono text-xs text-[var(--ink-muted)]">{label}</p>

      {error && <p className="font-mono text-xs text-red-400">{error}</p>}

      {currentUrl && (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={currentUrl} alt="" className="h-20 w-32 rounded-lg object-cover" />
          <label className="flex items-center gap-2 font-mono text-[11px] text-[var(--ink-muted)]">
            <input type="checkbox" name="removeImage" /> Quitar portada
          </label>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input type="file" name="image" accept="image/*" className="font-mono text-sm" />
        <button
          type="submit"
          disabled={pending}
          data-cursor="magnetic"
          className="rounded-full bg-[var(--accent)] px-4 py-1.5 font-mono text-[11px] text-[var(--bg)] disabled:opacity-50"
        >
          {pending ? "Subiendo…" : "Guardar portada"}
        </button>
      </div>
    </form>
  );
}
