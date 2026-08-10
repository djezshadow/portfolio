"use client";

import { useState } from "react";

export function WatermarkOverrideForm({
  mediaId,
  action,
  initialPosition,
  initialOpacity,
}: {
  mediaId: string;
  action: (mediaId: string, formData: FormData) => Promise<void>;
  initialPosition: string | null;
  initialOpacity: number | null;
}) {
  const [open, setOpen] = useState(Boolean(initialPosition || initialOpacity));
  const bound = action.bind(null, mediaId);

  if (!open) {
    return (
      <button
        type="button"
        data-cursor="magnetic"
        onClick={() => setOpen(true)}
        className="font-mono text-[9px] text-[var(--ink-muted)] underline"
      >
        Ajustar watermark
      </button>
    );
  }

  return (
    <form action={bound} className="space-y-1 rounded-lg border border-[var(--glass-border)] p-1.5">
      <label className="flex items-center gap-1 font-mono text-[9px] text-[var(--ink-muted)]">
        <input type="checkbox" name="useCustom" defaultChecked={Boolean(initialPosition || initialOpacity)} /> Personalizar acá
      </label>
      <select name="position" defaultValue={initialPosition ?? ""} className="w-full rounded border border-[var(--glass-border)] bg-transparent px-1 py-0.5 font-mono text-[9px]">
        <option value="">Posición global</option>
        <option value="bottom-right">Abajo derecha</option>
        <option value="bottom-left">Abajo izquierda</option>
        <option value="top-right">Arriba derecha</option>
        <option value="top-left">Arriba izquierda</option>
        <option value="center">Centro</option>
      </select>
      <input type="number" name="opacity" min={0} max={100} placeholder="% opacidad" defaultValue={initialOpacity ?? ""} className="w-full rounded border border-[var(--glass-border)] bg-transparent px-1 py-0.5 font-mono text-[9px]" />
      <button type="submit" data-cursor="magnetic" className="w-full rounded-full bg-[var(--accent)] py-0.5 font-mono text-[9px] text-[var(--bg)]">
        Guardar y rehornear
      </button>
    </form>
  );
}
