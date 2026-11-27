"use client";

import { useEffect, useRef, useState } from "react";
import { createAlbumImageKeys, deriveAlbumImageKey, exportAlbumPublicKey, importAlbumPublicKey } from "@/lib/album-image-crypto";

export function PrivateGallery({ photos, en, token }: { photos: { id: string; alt: string }[]; en: boolean; token?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  if (!photos.length) return <p>{en ? "This album is empty." : "Este álbum todavía está vacío."}</p>;
  const active = photos[index] ?? photos[0];
  const next = photos[(index + 1) % photos.length]?.id;
  const previous = photos[(index + photos.length - 1) % photos.length]?.id;
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
      {open && <PrivatePhoto key={token ?? "admin"} id={active.id} next={next} previous={previous}
        alt={active.alt || label(index)} en={en} token={token} />}
      <div className="mt-2 flex items-center justify-between">
        <button type="button" disabled={photos.length < 2} onClick={() => move(-1)} className="rounded px-3 py-2 disabled:opacity-40">{en ? "Previous" : "Anterior"}</button>
        <span aria-live="polite">{index + 1} / {photos.length}</span>
        <button type="button" disabled={photos.length < 2} onClick={() => move(1)} className="rounded px-3 py-2 disabled:opacity-40">{en ? "Next" : "Siguiente"}</button>
      </div>
    </dialog>
  </>;
}


type CachedPhoto = {
  promise: Promise<ImageBitmap>;
  controller: AbortController;
  bitmap?: ImageBitmap;
};

function releasePhoto(entry: CachedPhoto) {
  entry.controller.abort();
  entry.bitmap?.close();
}

async function downloadPhoto(id: string, token: string | undefined, signal: AbortSignal) {
  const keys = await createAlbumImageKeys();
  const response = await fetch(`/api/album-photo/${id}`, {
    method: "POST",
    headers: {
      "x-album-view": "1",
      "x-album-image-key": await exportAlbumPublicKey(keys.publicKey),
      ...(token ? { "x-album-token": token } : {}),
    },
    signal,
  });
  const publicKey = response.headers.get("x-album-image-key");
  if (!response.ok || !publicKey) throw new Error("Photo unavailable");
  const key = await deriveAlbumImageKey(await importAlbumPublicKey(publicKey), keys.privateKey, "decrypt");
  const payload = await response.arrayBuffer();
  const iv = new Uint8Array(payload, 0, 12);
  const image = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, payload.slice(12));
  signal.throwIfAborted();
  return createImageBitmap(new Blob([image], { type: "image/webp" }));
}

function PrivatePhoto({ id, next, previous, alt, en, token }: {
  id: string;
  next?: string;
  previous?: string;
  alt: string;
  en: boolean;
  token?: string;
}) {
  const [result, setResult] = useState<{ id: string; status: "loaded" | "error" } | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const cache = useRef(new Map<string, CachedPhoto>());
  const status = result?.id === id ? result.status : "loading";
  const src = `/api/album-photo/${id}`;

  useEffect(() => {
    const entries = cache.current;
    return () => {
      entries.forEach(releasePhoto);
      entries.clear();
    };
  }, []);

  useEffect(() => {
    const entries = cache.current;
    const neighbors = [...new Set([next, previous])].filter((neighbor): neighbor is string =>
      neighbor !== undefined && neighbor !== id
    );
    const keep = new Set([id, ...neighbors]);
    for (const [key, entry] of entries) {
      if (keep.has(key)) continue;
      entries.delete(key);
      releasePhoto(entry);
    }

    function load(photoId: string) {
      const existing = entries.get(photoId);
      if (existing) return existing.promise;

      const controller = new AbortController();
      const entry: CachedPhoto = {
        controller,
        promise: downloadPhoto(photoId, token, controller.signal).then((bitmap) => {
          if (controller.signal.aborted) {
            bitmap.close();
            throw controller.signal.reason;
          }
          entry.bitmap = bitmap;
          return bitmap;
        }).catch((error) => {
          if (entries.get(photoId) === entry) entries.delete(photoId);
          throw error;
        }),
      };
      entries.set(photoId, entry);
      return entry.promise;
    }

    let cancelled = false;
    async function draw() {
      try {
        const bitmap = await load(id);
        if (cancelled) return;
        const element = canvas.current;
        const context = element?.getContext("2d");
        if (!element || !context) throw new Error("Canvas unavailable");
        element.width = bitmap.width;
        element.height = bitmap.height;
        context.drawImage(bitmap, 0, 0);
        setResult({ id, status: "loaded" });
      } catch {
        if (!cancelled) setResult({ id, status: "error" });
        return;
      }

      for (const neighbor of neighbors) {
        if (cancelled) break;
        // A failed speculative request can be retried when the visitor opens it.
        await load(neighbor).catch(() => {});
      }
    }

    setResult(null);
    void draw();
    return () => { cancelled = true; };
  }, [id, next, previous, token]);

  return <div className="relative grid min-h-32 place-items-center" aria-busy={status === "loading"}>
    <canvas key={id} ref={canvas} aria-hidden="true"
      className={`mx-auto max-h-[72dvh] w-full object-contain ${status === "loaded" ? "" : "invisible"}`} />
    {status !== "error" && <img src={src} draggable={false} alt={alt}
      className={`absolute inset-0 h-full w-full object-contain ${status === "loaded" ? "opacity-0" : ""}`} />}
    {status === "error" && <p role="status" className="absolute">{en ? "Photo unavailable." : "No se pudo cargar la foto."}</p>}
  </div>;
}
