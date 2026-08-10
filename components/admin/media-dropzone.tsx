"use client";

import { useEffect, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import clsx from "clsx";
import { parseVideoUrl } from "@/lib/video-url";

type UploadItem = {
  id: string;
  file: File;
  previewUrl: string;
  status: "uploading" | "done" | "error";
  progress?: number;
  blobUrl?: string;
  errorMessage?: string;
};

export function MediaDropzone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [videoUrls, setVideoUrls] = useState<string[]>([""]);

  const uploadingCount = items.filter((it) => it.status === "uploading").length;

  // Si todavía hay fotos subiendo, no dejamos mandar el formulario —
  // evita guardar el proyecto sin todas las fotos asociadas.
  useEffect(() => {
    const form = wrapperRef.current?.closest("form");
    if (!form) return;
    const guard = (e: SubmitEvent) => {
      if (uploadingCount > 0) {
        e.preventDefault();
        alert(`Esperá a que terminen de subir las ${uploadingCount} foto(s) pendientes.`);
      }
    };
    form.addEventListener("submit", guard);
    return () => form.removeEventListener("submit", guard);
  }, [uploadingCount]);

  async function uploadOne(item: UploadItem) {
    try {
      const blob = await upload(item.file.name, item.file, {
        access: "public",
        handleUploadUrl: "/api/admin/upload-token",
        onUploadProgress: ({ percentage }) => {
          setItems((prev) =>
            prev.map((it) => (it.id === item.id ? { ...it, progress: percentage } : it))
          );
        },
      });
      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, status: "done", progress: 100, blobUrl: blob.url } : it))
      );
    } catch (err) {
      console.error("Error subiendo", item.file.name, err);
      setItems((prev) =>
        prev.map((it) =>
          it.id === item.id
            ? { ...it, status: "error", errorMessage: err instanceof Error ? err.message : String(err) }
            : it
        )
      );
    }
  }

  function retryItem(id: string) {
    const item = items.find((it) => it.id === id);
    if (!item) return;
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: "uploading" } : it)));
    uploadOne({ ...item, status: "uploading" });
  }

  async function uploadFiles(files: FileList) {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));

    const newItems: UploadItem[] = imageFiles.map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
      status: "uploading",
    }));

    setItems((prev) => [...prev, ...newItems]);

    for (const item of newItems) {
      // Se sube directo desde el navegador al storage — no pasa por el
      // límite de tamaño del server action, así que fotos de cámara
      // reales (varios MB, varias juntas) no rompen nada.
      await uploadOne(item);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  return (
    <div className="glass space-y-4 rounded-2xl p-4" ref={wrapperRef}>
      <p className="font-mono text-xs text-[var(--ink-muted)]">Media (fotos y videos)</p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={clsx(
          "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors",
          dragging ? "border-[var(--accent)]" : "border-[var(--glass-border)]"
        )}
        data-cursor="magnetic"
      >
        <p className="font-mono text-sm text-[var(--ink-muted)]">
          Arrastrá fotos acá, o hacé click para elegir archivos
        </p>
        <p className="mt-1 font-mono text-[10px] text-[var(--ink-muted)]">
          Se suben solas apenas las soltás — no hace falta nada más antes de guardar
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
      </div>

      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {items.map((item) => (
            <div key={item.id} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.previewUrl}
                alt=""
                className={clsx(
                  "aspect-square rounded-xl object-cover transition-opacity",
                  item.status === "uploading" && "opacity-50"
                )}
              />
              {item.status === "uploading" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-2">
                  <span className="font-mono text-[10px] text-white">{Math.round(item.progress ?? 0)}%</span>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-black/40">
                    <div
                      className="h-full rounded-full bg-[var(--accent)] transition-all"
                      style={{ width: `${item.progress ?? 0}%` }}
                    />
                  </div>
                </div>
              )}
              {item.status === "done" && (
                <span className="absolute bottom-1 right-1 rounded-full bg-[var(--accent)] px-2 py-0.5 font-mono text-[9px] text-[var(--bg)]">
                  ✓ listo
                </span>
              )}
              {item.status === "error" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-xl bg-red-950/90 p-1 text-center">
                  <span className="font-mono text-[9px] text-white">Error</span>
                  <span className="line-clamp-3 font-mono text-[8px] text-red-200">
                    {item.errorMessage}
                  </span>
                  <button
                    type="button"
                    onClick={() => retryItem(item.id)}
                    data-cursor="magnetic"
                    className="rounded-full bg-white/20 px-2 py-0.5 font-mono text-[8px] text-white"
                  >
                    Reintentar
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                data-cursor="magnetic"
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white"
                aria-label="Quitar"
              >
                ×
              </button>
              {/* Cada foto ya subida manda su URL final — el guardado
                  del proyecto solo asocia estas URLs, no vuelve a subir nada. */}
              {item.status === "done" && item.blobUrl && (
                <input type="hidden" name="uploadedImageUrls" value={item.blobUrl} />
              )}
            </div>
          ))}
        </div>
      )}

      {uploadingCount > 0 && (
        <div className="space-y-1.5">
          <p className="font-mono text-[11px] text-accent">
            Subiendo {uploadingCount} foto{uploadingCount > 1 ? "s" : ""}… esperá a que termine antes de guardar.
          </p>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/20">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-all"
              style={{
                width: `${
                  items.filter((it) => it.status === "uploading").reduce((sum, it) => sum + (it.progress ?? 0), 0) /
                  uploadingCount
                }%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Links de video — mismo contenedor que las fotos, se pueden agregar varios */}
      <div className="space-y-2 border-t border-[var(--glass-border)] pt-4">
        <p className="font-mono text-[11px] text-[var(--ink-muted)]">Links de YouTube o Vimeo (opcional)</p>
        {videoUrls.map((url, i) => {
          const parsed = url ? parseVideoUrl(url) : null;
          return (
            <div key={i} className="flex items-center gap-2">
              <input
                name="videoUrls"
                value={url}
                onChange={(e) => {
                  const next = [...videoUrls];
                  next[i] = e.target.value;
                  setVideoUrls(next);
                }}
                placeholder="https://youtube.com/watch?v=... o https://vimeo.com/..."
                className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2 font-mono text-sm"
              />
              <span
                className="w-16 shrink-0 font-mono text-[10px]"
                style={{ color: parsed ? "var(--accent)" : "var(--ink-muted)" }}
              >
                {url ? (parsed ? parsed.provider.toUpperCase() : "no reconocido") : ""}
              </span>
              {videoUrls.length > 1 && (
                <button
                  type="button"
                  onClick={() => setVideoUrls(videoUrls.filter((_, idx) => idx !== i))}
                  data-cursor="magnetic"
                  className="shrink-0 font-mono text-xs text-[var(--accent-contrast)]"
                >
                  Quitar
                </button>
              )}
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => setVideoUrls([...videoUrls, ""])}
          data-cursor="magnetic"
          className="font-mono text-xs text-accent underline"
        >
          + agregar otro link
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-[var(--glass-border)] pt-4 font-mono text-xs">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="watermarkEnabled"
            checked={watermarkEnabled}
            onChange={(e) => setWatermarkEnabled(e.target.checked)}
          />
          Watermark en estas fotos
        </label>
        <span className="text-[var(--ink-muted)]">
          El logo, opacidad, posición y escala se configuran en{" "}
          <a href="/admin/configuracion" className="underline">
            Configuración
          </a>{" "}
          — se aplican al vuelo, así que si los cambiás después, se actualiza acá también sin tener
          que volver a subir nada.
        </span>
      </div>
    </div>
  );
}
