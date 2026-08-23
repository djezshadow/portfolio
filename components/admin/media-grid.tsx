"use client";

import { useState } from "react";
import Image from "next/image";
import { WatermarkOverrideForm } from "./watermark-override-form";
import { ExifForm } from "./exif-form";
import { AltTextForm } from "./alt-text-form";
import { ReorderButtons } from "./reorder-buttons";

type MediaItem = {
  id: string;
  type: string;
  url: string;
  videoProvider: string | null;
  groupId: string | null;
  isThumbnail: boolean;
  watermarkPositionOverride: string | null;
  watermarkOpacityOverride: number | null;
  exifCamera: string | null;
  exifAperture: string | null;
  exifShutterSpeed: string | null;
  exifIso: string | null;
  exifFps: string | null;
  altText: string | null;
  altTextEn: string | null;
};

/**
 * Pedido: "poder mover de lugar las fotos... con drag and drop".
 *
 * Todo el contenido de cada foto (checkbox de borrar, subcategoría,
 * radio de portada, watermark, EXIF, alt text) vive DENTRO de este
 * componente cliente en vez de recibirlo como render-prop desde
 * page.tsx — pasar una función de un Server Component a un Client
 * Component no está permitido en Next.js (solo datos y Server Actions),
 * así que todo el JSX por-ítem tiene que armarse acá adentro.
 *
 * Drag-and-drop nativo (HTML5) solo funciona con mouse — no existe en
 * touch (celular/tablet) ni es operable por teclado. Por eso las
 * flechitas de ReorderButtons se mantienen: son la forma de reordenar
 * en mobile y la única accesible por teclado (WCAG 2.5.7 — nunca
 * depender solo del arrastre para una acción).
 */
export function MediaGrid({
  media,
  mediaGroups,
  moveMediaOrder,
  reorderMedia,
  updateMediaWatermarkOverride,
  updateMediaExif,
  updateMediaAlt,
}: {
  media: MediaItem[];
  mediaGroups: { id: string; name: string }[];
  moveMediaOrder: (mediaId: string, direction: "up" | "down") => Promise<void>;
  reorderMedia: (orderedIds: string[]) => Promise<void>;
  updateMediaWatermarkOverride: (mediaId: string, formData: FormData) => Promise<void>;
  updateMediaExif: (mediaId: string, formData: FormData) => Promise<void>;
  updateMediaAlt: (mediaId: string, formData: FormData) => Promise<void>;
}) {
  const [order, setOrder] = useState(media);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const fromIndex = order.findIndex((i) => i.id === dragId);
    const toIndex = order.findIndex((i) => i.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    const next = [...order];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setOrder(next);
    setDragId(null);
    setOverId(null);
    void reorderMedia(next.map((i) => i.id));
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {order.map((m, mi) => (
        <div
          key={m.id}
          draggable
          onDragStart={() => setDragId(m.id)}
          onDragOver={(e) => {
            e.preventDefault();
            if (overId !== m.id) setOverId(m.id);
          }}
          onDragLeave={() => setOverId((cur) => (cur === m.id ? null : cur))}
          onDrop={(e) => {
            e.preventDefault();
            handleDrop(m.id);
          }}
          onDragEnd={() => {
            setDragId(null);
            setOverId(null);
          }}
          className={`space-y-1.5 rounded-xl transition-opacity ${dragId === m.id ? "cursor-grabbing opacity-40" : "cursor-grab"} ${
            overId === m.id && dragId && dragId !== m.id ? "ring-2 ring-[var(--accent)]" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] text-[var(--ink-muted)]">#{mi + 1}</span>
            <ReorderButtons
              onMove={moveMediaOrder.bind(null, m.id)}
              disableUp={mi === 0}
              disableDown={mi === order.length - 1}
            />
          </div>
          <label className="relative block cursor-pointer">
            {m.type === "image" ? (
              <Image
                src={m.url}
                alt=""
                width={150}
                height={150}
                className="aspect-square w-full rounded-xl object-cover"
              />
            ) : (
              <div className="flex aspect-square items-center justify-center rounded-xl bg-black/30 font-mono text-[10px]">
                {m.videoProvider?.toUpperCase()}
              </div>
            )}
            <span className="absolute inset-0 flex items-end justify-end rounded-xl bg-black/0 p-1 transition-colors hover:bg-black/40">
              <input type="checkbox" name="deleteMedia" value={m.id} className="accent-red-500" />
            </span>
          </label>
          {mediaGroups.length > 0 && (
            <select
              name={`mediaGroup:${m.id}`}
              defaultValue={m.groupId ?? ""}
              className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-1.5 py-1 font-mono text-[10px]"
            >
              <option value="">Sin subcategoría</option>
              {mediaGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          )}
          <label className="flex items-center gap-1.5 font-mono text-[10px] text-[var(--ink-muted)]">
            <input type="radio" name="thumbnailMediaId" value={m.id} defaultChecked={m.isThumbnail} />
            Portada
          </label>
          {m.type === "image" && (
            <WatermarkOverrideForm
              mediaId={m.id}
              action={updateMediaWatermarkOverride}
              initialPosition={m.watermarkPositionOverride}
              initialOpacity={m.watermarkOpacityOverride}
            />
          )}
          {m.type === "image" && (
            <ExifForm
              mediaId={m.id}
              action={updateMediaExif}
              initial={{
                exifCamera: m.exifCamera,
                exifAperture: m.exifAperture,
                exifShutterSpeed: m.exifShutterSpeed,
                exifIso: m.exifIso,
                exifFps: m.exifFps,
              }}
            />
          )}
          {m.type === "image" && (
            <AltTextForm
              mediaId={m.id}
              action={updateMediaAlt}
              initial={{ altText: m.altText, altTextEn: m.altTextEn }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
