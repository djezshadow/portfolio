"use client";

import { useState } from "react";
import { compressImageForUpload } from "@/lib/compress-image";

export function NotFoundForm({
  action,
  initial,
}: {
  action: (formData: FormData) => Promise<{ ok: boolean; error?: string }>;
  initial: {
    notFoundTitle: string | null;
    notFoundTitleEn: string | null;
    notFoundMessage: string | null;
    notFoundMessageEn: string | null;
    notFoundImageUrl: string | null;
  };
}) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  return (
    <form
      action={async (formData: FormData) => {
        setError(null);
        setSaved(false);
        const file = formData.get("image") as File | null;
        if (file && file.size > 0) {
          const compressed = await compressImageForUpload(file, { maxWidth: 1000 });
          formData.set("image", compressed);
        }
        const result = await action(formData);
        if (!result.ok) setError(result.error ?? "No se pudo guardar.");
        else setSaved(true);
      }}
      className="glass space-y-4 rounded-2xl p-5"
    >
      {error && <p className="font-mono text-xs text-red-400">{error}</p>}
      {saved && <p className="font-mono text-xs text-green-400">Guardado ✓</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Título (ES)</label>
          <input
            name="notFoundTitle"
            defaultValue={initial.notFoundTitle ?? ""}
            placeholder="Escena no encontrada"
            className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Título (EN)</label>
          <input
            name="notFoundTitleEn"
            defaultValue={initial.notFoundTitleEn ?? ""}
            placeholder="Scene not found"
            className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Mensaje (ES)</label>
          <textarea
            name="notFoundMessage"
            rows={3}
            defaultValue={initial.notFoundMessage ?? ""}
            placeholder="Esta toma no quedó en el corte final..."
            className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Mensaje (EN)</label>
          <textarea
            name="notFoundMessageEn"
            rows={3}
            defaultValue={initial.notFoundMessageEn ?? ""}
            placeholder="This shot didn't make the final cut..."
            className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
          Imagen (opcional) {initial.notFoundImageUrl ? "— reemplaza la actual" : ""}
        </label>
        {initial.notFoundImageUrl && (
          <div className="mb-2 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={initial.notFoundImageUrl} alt="" className="h-20 w-32 rounded-lg object-cover" />
            <label className="flex items-center gap-2 font-mono text-[11px] text-[var(--ink-muted)]">
              <input type="checkbox" name="removeImage" /> Quitar imagen
            </label>
          </div>
        )}
        <input type="file" name="image" accept="image/*" className="font-mono text-sm" />
      </div>

      <p className="font-mono text-[10px] text-[var(--ink-muted)]">
        Dejá los textos vacíos para usar el mensaje bilingüe por defecto.
      </p>

      <button
        type="submit"
        data-cursor="magnetic"
        className="rounded-full bg-[var(--accent)] px-5 py-2 font-mono text-xs text-[var(--bg)]"
      >
        Guardar
      </button>
    </form>
  );
}
