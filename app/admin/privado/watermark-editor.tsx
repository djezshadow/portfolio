"use client";

import { useEffect, useRef, useState } from "react";
import { setAlbumPhotoWatermark } from "./actions";

type Point = { x: number; y: number };
type Photo = { id: string; alt: string; watermarkX: number | null; watermarkY: number | null };

export function AlbumWatermarkEditor({ photos, defaultPoint }: { photos: Photo[]; defaultPoint: Point }) {
  const [index, setIndex] = useState(0);
  const photo = photos[index] ?? photos.at(-1);
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  if (!photo) return null;

  return <>
    <button type="button" className="glass rounded-lg px-4 py-2"
      onClick={() => { setOpen(true); dialog.current?.showModal(); }}>
      Acomodar marcas de agua
    </button>
    <dialog ref={dialog} onClose={() => setOpen(false)} aria-label="Editor de marcas de agua"
      className="m-auto max-h-[94dvh] w-[min(96vw,64rem)] overflow-y-auto rounded-xl bg-neutral-950 p-4 text-white backdrop:bg-black/75">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-display text-xl">Marca de agua por foto</h3>
        <button type="button" autoFocus onClick={() => dialog.current?.close()} className="glass rounded-lg px-3 py-2">Cerrar</button>
      </div>
      {open && <PhotoPosition key={photo.id} photo={photo} defaultPoint={defaultPoint} index={photos.indexOf(photo)}
        count={photos.length} onNavigate={setIndex} />}
    </dialog>
  </>;
}

function PhotoPosition({ photo, defaultPoint, index, count, onNavigate }: {
  photo: Photo; defaultPoint: Point; index: number; count: number; onNavigate: (index: number) => void;
}) {
  const initial = photo.watermarkX === null || photo.watermarkY === null ? null : { x: photo.watermarkX, y: photo.watermarkY };
  const [saved, setSaved] = useState<Point | null>(initial);
  const [draft, setDraft] = useState<Point | null>(initial);
  const [preview, setPreview] = useState<Point | null>(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const dirty = draft?.x !== saved?.x || draft?.y !== saved?.y;
  const point = draft ?? defaultPoint;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPreview(draft);
      setFailed(false);
    }, 240);
    return () => window.clearTimeout(timer);
  }, [draft]);

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      await setAlbumPhotoWatermark(photo.id, draft?.x ?? null, draft?.y ?? null);
      setSaved(draft);
      setMessage("Posición guardada.");
    } catch {
      setMessage("No se pudo guardar la posición.");
    } finally {
      setSaving(false);
    }
  }

  function navigate(next: number) {
    if (!dirty || window.confirm("¿Cambiar de foto sin guardar la posición?")) onNavigate(next);
  }

  return <div className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <button type="button" disabled={saving || index === 0} className="glass rounded-lg px-3 py-2 disabled:opacity-40"
        onClick={() => navigate(index - 1)}>Anterior</button>
      <span aria-live="polite">Foto {index + 1} de {count}</span>
      <button type="button" disabled={saving || index + 1 >= count} className="glass rounded-lg px-3 py-2 disabled:opacity-40"
        onClick={() => navigate(index + 1)}>Siguiente</button>
    </div>
    <p className="text-sm">Tocá o arrastrá sobre la foto para ubicar la marca. También podés usar los controles de posición.</p>
    <div className="grid place-items-center">
      <div className="relative min-w-0 max-w-full touch-none select-none"
        onPointerDown={(event) => {
          if (saving || event.button !== 0) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          updatePosition(event);
        }}
        onPointerMove={(event) => {
          if (!saving && event.currentTarget.hasPointerCapture(event.pointerId)) updatePosition(event);
        }}>
        <img src={`/api/album-photo/${photo.id}?preview=1${preview ? `&x=${preview.x}&y=${preview.y}` : ""}`}
          alt={photo.alt || "Vista previa de la foto"} draggable={false}
          onLoad={() => setFailed(false)} onError={() => setFailed(true)}
          className="block max-h-[54dvh] max-w-full cursor-crosshair rounded object-contain" />
        {dirty && draft && <span aria-hidden className="pointer-events-none absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_black]"
          style={{ left: `${draft.x * 100}%`, top: `${draft.y * 100}%` }} />}
      </div>
    </div>
    {failed && <p role="status">No se pudo cargar la vista previa.</p>}
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm">Posición horizontal
        <input type="range" min="0" max="100" step="1" value={Math.round(point.x * 100)} disabled={saving}
          onChange={(event) => setDraft({ ...point, x: Number(event.target.value) / 100 })} className="block w-full" />
      </label>
      <label className="text-sm">Posición vertical
        <input type="range" min="0" max="100" step="1" value={Math.round(point.y * 100)} disabled={saving}
          onChange={(event) => setDraft({ ...point, y: Number(event.target.value) / 100 })} className="block w-full" />
      </label>
    </div>
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={saving || !dirty} onClick={save}
        className="rounded-lg bg-[var(--accent)] px-4 py-2 text-[var(--bg)] disabled:opacity-40">
        {saving ? "Guardando…" : "Guardar posición"}
      </button>
      <button type="button" disabled={saving || !draft} onClick={() => setDraft(null)}
        className="glass rounded-lg px-4 py-2 disabled:opacity-40">Usar posición general</button>
    </div>
    {message && <p role="status" className="text-sm">{message}</p>}
  </div>;

  function updatePosition(event: React.PointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const clamp = (value: number) => Math.round(Math.max(0, Math.min(1, value)) * 1000) / 1000;
    setDraft({ x: clamp((event.clientX - box.left) / box.width), y: clamp((event.clientY - box.top) / box.height) });
  }
}
