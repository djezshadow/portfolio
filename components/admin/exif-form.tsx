"use client";

import { useState } from "react";

/**
 * OJO: mismo motivo que WatermarkOverrideForm — vive DENTRO del <form>
 * principal del proyecto, así que no puede ser un <form> propio (HTML
 * no permite forms anidados). Arma el FormData a mano y llama la server
 * action directo.
 */
export function ExifForm({
  mediaId,
  action,
  initial,
}: {
  mediaId: string;
  action: (mediaId: string, formData: FormData) => Promise<void>;
  initial: {
    exifCamera: string | null;
    exifAperture: string | null;
    exifShutterSpeed: string | null;
    exifIso: string | null;
    exifFps: string | null;
  };
}) {
  const hasAny = Boolean(
    initial.exifCamera || initial.exifAperture || initial.exifShutterSpeed || initial.exifIso || initial.exifFps
  );
  const [open, setOpen] = useState(hasAny);
  const [camera, setCamera] = useState(initial.exifCamera ?? "");
  const [aperture, setAperture] = useState(initial.exifAperture ?? "");
  const [shutter, setShutter] = useState(initial.exifShutterSpeed ?? "");
  const [iso, setIso] = useState(initial.exifIso ?? "");
  const [fps, setFps] = useState(initial.exifFps ?? "");
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
        📷 Cargar EXIF
      </button>
    );
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const fd = new FormData();
    fd.set("exifCamera", camera);
    fd.set("exifAperture", aperture);
    fd.set("exifShutterSpeed", shutter);
    fd.set("exifIso", iso);
    fd.set("exifFps", fps);
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
        Todo opcional — el HUD solo aparece en las fotos donde cargues algo.
      </p>
      <input
        placeholder="Cámara (ej. Sony A7III)"
        value={camera}
        onChange={(e) => setCamera(e.target.value)}
        className="w-full rounded border border-[var(--glass-border)] bg-transparent px-1 py-0.5 font-mono text-[9px]"
      />
      <div className="grid grid-cols-2 gap-1">
        <input
          placeholder="Apertura (f/1.8)"
          value={aperture}
          onChange={(e) => setAperture(e.target.value)}
          className="w-full rounded border border-[var(--glass-border)] bg-transparent px-1 py-0.5 font-mono text-[9px]"
        />
        <input
          placeholder="Obturación (1/125)"
          value={shutter}
          onChange={(e) => setShutter(e.target.value)}
          className="w-full rounded border border-[var(--glass-border)] bg-transparent px-1 py-0.5 font-mono text-[9px]"
        />
        <input
          placeholder="ISO (800)"
          value={iso}
          onChange={(e) => setIso(e.target.value)}
          className="w-full rounded border border-[var(--glass-border)] bg-transparent px-1 py-0.5 font-mono text-[9px]"
        />
        <input
          placeholder="FPS (24)"
          value={fps}
          onChange={(e) => setFps(e.target.value)}
          className="w-full rounded border border-[var(--glass-border)] bg-transparent px-1 py-0.5 font-mono text-[9px]"
        />
      </div>
      <button
        type="button"
        data-cursor="magnetic"
        disabled={saving}
        onClick={handleSave}
        className="w-full rounded-full bg-[var(--accent)] py-0.5 font-mono text-[9px] text-[var(--bg)] disabled:opacity-50"
      >
        {saving ? "Guardando…" : saved ? "Listo ✓" : "Guardar EXIF"}
      </button>
    </div>
  );
}
