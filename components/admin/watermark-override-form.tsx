"use client";

import { useState } from "react";

/**
 * OJO: esto vive DENTRO de la grilla de fotos, que a su vez está dentro
 * del <form> principal de "Guardar cambios" del proyecto (para que
 * portada/subcategoría/borrar sigan viajando en ese mismo submit). Un
 * <form> anidado adentro de otro <form> es HTML inválido y el navegador
 * lo ignora/aplana — por eso NO se usa <form action={...}> acá, sino un
 * botón suelto que arma el FormData a mano y llama la server action
 * directo por código.
 */
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
  const [useCustom, setUseCustom] = useState(Boolean(initialPosition || initialOpacity));
  const [position, setPosition] = useState(initialPosition ?? "");
  const [opacity, setOpacity] = useState(initialOpacity != null ? String(initialOpacity) : "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const fd = new FormData();
    if (useCustom) fd.set("useCustom", "on");
    fd.set("position", position);
    fd.set("opacity", opacity);
    try {
      await action(mediaId, fd);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-1 rounded-lg border border-[var(--glass-border)] p-1.5">
      <label className="flex items-center gap-1 font-mono text-[9px] text-[var(--ink-muted)]">
        <input type="checkbox" checked={useCustom} onChange={(e) => setUseCustom(e.target.checked)} /> Personalizar acá
      </label>
      <select
        value={position}
        onChange={(e) => setPosition(e.target.value)}
        className="w-full rounded border border-[var(--glass-border)] bg-transparent px-1 py-0.5 font-mono text-[9px]"
      >
        <option value="">Posición global</option>
        <option value="bottom-right">Abajo derecha</option>
        <option value="bottom-left">Abajo izquierda</option>
        <option value="top-right">Arriba derecha</option>
        <option value="top-left">Arriba izquierda</option>
        <option value="center">Centro</option>
      </select>
      <input
        type="number"
        min={0}
        max={100}
        placeholder="% opacidad"
        value={opacity}
        onChange={(e) => setOpacity(e.target.value)}
        className="w-full rounded border border-[var(--glass-border)] bg-transparent px-1 py-0.5 font-mono text-[9px]"
      />
      <button
        type="button"
        data-cursor="magnetic"
        disabled={saving}
        onClick={handleSave}
        className="w-full rounded-full bg-[var(--accent)] py-0.5 font-mono text-[9px] text-[var(--bg)] disabled:opacity-50"
      >
        {saving ? "Guardando…" : saved ? "Listo ✓" : "Guardar y rehornear"}
      </button>
    </div>
  );
}
