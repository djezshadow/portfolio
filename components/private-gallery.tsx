"use client";

import { useEffect, useRef, useState } from "react";

export function PrivateGallery({ photos, en }: { photos: { id: string; alt: string }[]; en: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  if (!photos.length) return <p>{en ? "This album is empty." : "Este álbum todavía está vacío."}</p>;
  const active = photos[index] ?? photos[0];
  const label = (i: number) => en ? `Photo ${i + 1}` : `Foto ${i + 1}`;
  const move = (step: number) => setIndex((current) => (current + step + photos.length) % photos.length);
  return <>
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {photos.map((photo, i) => <button key={photo.id} type="button" aria-label={photo.alt || label(i)}
        className="glass overflow-hidden rounded-xl focus-visible:outline-2 focus-visible:outline-accent"
        onClick={() => { setIndex(i); setOpen(true); dialog.current?.showModal(); }}>
        <img src={`/api/album-photo/${photo.id}?thumb=1`} alt={photo.alt} loading="lazy" className="aspect-[4/3] w-full object-cover" />
      </button>)}
    </div>
    <dialog ref={dialog} onClose={() => setOpen(false)} aria-label={en ? "Photo viewer" : "Visor de fotos"}
      className="m-auto w-[min(96vw,72rem)] rounded-2xl bg-neutral-950 p-4 text-white backdrop:bg-black/80"
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault();
          move(e.key === "ArrowLeft" ? -1 : 1);
        }
      }}>
      <div className="flex justify-end">
        <button type="button" autoFocus onClick={() => dialog.current?.close()} className="rounded px-3 py-2">{en ? "Close" : "Cerrar"}</button>
      </div>
      {open && <PrivatePhoto key={active.id} id={active.id} alt={active.alt || label(index)} en={en} />}
      <div className="mt-2 flex items-center justify-between">
        <button type="button" disabled={photos.length < 2} onClick={() => move(-1)} className="rounded px-3 py-2 disabled:opacity-40">{en ? "Previous" : "Anterior"}</button>
        <span aria-live="polite">{index + 1} / {photos.length}</span>
        <button type="button" disabled={photos.length < 2} onClick={() => move(1)} className="rounded px-3 py-2 disabled:opacity-40">{en ? "Next" : "Siguiente"}</button>
      </div>
    </dialog>
  </>;
}

function PrivatePhoto({ id, alt, en }: { id: string; alt: string; en: boolean }) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const canvas = useRef<HTMLCanvasElement>(null);
  const src = `/api/album-photo/${id}`;

  useEffect(() => {
    const controller = new AbortController();
    async function draw() {
      try {
        const response = await fetch(src, {
          method: "POST",
          headers: { "x-album-view": "1" },
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Photo unavailable");
        const bitmap = await createImageBitmap(await response.blob());
        try {
          if (controller.signal.aborted) return;
          const element = canvas.current;
          const context = element?.getContext("2d");
          if (!element || !context) throw new Error("Canvas unavailable");
          element.width = bitmap.width;
          element.height = bitmap.height;
          context.drawImage(bitmap, 0, 0);
          setStatus("loaded");
        } finally {
          bitmap.close();
        }
      } catch {
        if (!controller.signal.aborted) setStatus("error");
      }
    }
    void draw();
    return () => controller.abort();
  }, [src]);

  return <div className="relative grid min-h-32 place-items-center" aria-busy={status === "loading"}>
    <canvas ref={canvas} aria-hidden="true"
      className={`mx-auto max-h-[72dvh] w-full object-contain ${status === "loaded" ? "" : "invisible"}`} />
    {status !== "error" && <img src={src} draggable={false} alt={alt}
      className={`absolute inset-0 h-full w-full object-contain ${status === "loaded" ? "opacity-0" : ""}`} />}
    {status === "error" && <p role="status" className="absolute">{en ? "Photo unavailable." : "No se pudo cargar la foto."}</p>}
  </div>;
}
