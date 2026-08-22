"use client";

import { useState } from "react";

/**
 * Pedido: "poder añadirles la descripción de accesibilidad a cada
 * foto". Mismo motivo que ExifForm/WatermarkOverrideForm — vive DENTRO
 * del <form> principal del proyecto, así que no puede ser un <form>
 * propio (HTML no permite forms anidados).
 */
export function AltTextForm({
  mediaId,
  action,
  initial,
}: {
  mediaId: string;
  action: (mediaId: string, formData: FormData) => Promise<void>;
  initial: { altText: string | null; altTextEn: string | null };
}) {
  const [open, setOpen] = useState(Boolean(initial.altText || initial.altTextEn));
  const [altText, setAltText] = useState(initial.altText ?? "");
  const [altTextEn, setAltTextEn] = useState(initial.altTextEn ?? "");
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
        ♿ Alt text
      </button>
    );
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const fd = new FormData();
    fd.set("altText", altText);
    fd.set("altTextEn", altTextEn);
    try {
      await action(mediaId, fd);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-1 rounded-lg border border-[var(--glass-border)] p-1.5">
      <p className="font-mono text-[9px] text-[var(--ink-muted)]">
        Describí qué se ve en la foto — la leen los lectores de pantalla. Vacío = usa un texto
        genérico con el título del proyecto.
      </p>
      <input
        placeholder="Descripción (ES)"
        value={altText}
        onChange={(e) => setAltText(e.target.value)}
        className="w-full rounded border border-[var(--glass-border)] bg-transparent px-1 py-0.5 font-mono text-[9px]"
      />
      <input
        placeholder="Descripción (EN)"
        value={altTextEn}
        onChange={(e) => setAltTextEn(e.target.value)}
        className="w-full rounded border border-[var(--glass-border)] bg-transparent px-1 py-0.5 font-mono text-[9px]"
      />
      <button
        type="button"
        data-cursor="magnetic"
        disabled={saving}
        onClick={handleSave}
        className="w-full rounded-full bg-[var(--accent)] py-0.5 font-mono text-[9px] text-[var(--bg)] disabled:opacity-50"
      >
        {saving ? "Guardando…" : saved ? "Listo ✓" : "Guardar descripción"}
      </button>
    </div>
  );
}
