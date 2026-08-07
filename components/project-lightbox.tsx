"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { VideoEmbed } from "./video-embed";
import { getVideoThumbnail } from "@/lib/video-url";

type MediaItem = {
  id: string;
  type: "image" | "video";
  url: string;
  videoProvider?: "youtube" | "vimeo" | null;
  videoId?: string | null;
  groupId?: string | null;
};

type MediaGroupInfo = { id: string; name: string };

type LightboxProject = {
  title: string;
  role: string | null;
  description: string | null;
  collaboratorName?: string | null;
  dateLabel?: string | null;
  media: MediaItem[];
  /// Subcategorías del proyecto (item #13), ya en el orden en que se
  /// definieron — la media sin grupo se muestra al final, sin etiqueta.
  groups?: MediaGroupInfo[];
};

/// Reordena la media agrupándola por subcategoría (en el orden de
/// `groups`), dejando la que no tiene grupo al final. Devuelve también,
/// por cada índice, el nombre de grupo a mostrar como separador (solo en
/// el primer ítem de cada grupo).
function groupMedia(media: MediaItem[], groups: MediaGroupInfo[]) {
  if (groups.length === 0) return { ordered: media, labelForIndex: new Map<number, string>() };

  const byGroup = new Map<string, MediaItem[]>();
  const ungrouped: MediaItem[] = [];
  for (const m of media) {
    if (m.groupId && groups.some((g) => g.id === m.groupId)) {
      const list = byGroup.get(m.groupId) ?? [];
      list.push(m);
      byGroup.set(m.groupId, list);
    } else {
      ungrouped.push(m);
    }
  }

  const ordered: MediaItem[] = [];
  const labelForIndex = new Map<number, string>();
  for (const g of groups) {
    const items = byGroup.get(g.id);
    if (!items || items.length === 0) continue;
    labelForIndex.set(ordered.length, g.name);
    ordered.push(...items);
  }
  if (ungrouped.length > 0) {
    if (ordered.length > 0) labelForIndex.set(ordered.length, "—");
    ordered.push(...ungrouped);
  }

  return { ordered, labelForIndex };
}

export function ProjectLightbox({
  project,
  onClose,
}: {
  project: LightboxProject;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const { ordered: media, labelForIndex } = groupMedia(project.media, project.groups ?? []);
  const current = media[index];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % media.length);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + media.length) % media.length);
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    document.body.setAttribute("data-lightbox-open", "true");
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      document.body.removeAttribute("data-lightbox-open");
    };
  }, [media.length, onClose]);

  // Precarga: apenas se abre, disparamos la descarga de TODAS las fotos
  // (tamaño completo) en segundo plano. Cuando el usuario navega con las
  // flechas, la imagen ya está en la cache del navegador — no vuelve a cargar.
  useEffect(() => {
    const preloaded: HTMLImageElement[] = [];
    for (const m of media) {
      if (m.type === "image") {
        const img = new window.Image();
        img.src = `/api/media/${m.id}`;
        preloaded.push(img);
      } else if (m.videoProvider && m.videoId) {
        const thumb = getVideoThumbnail(m.videoProvider, m.videoId);
        if (thumb) {
          const img = new window.Image();
          img.src = thumb;
          preloaded.push(img);
        }
      }
    }
    return () => {
      preloaded.forEach((img) => {
        img.src = "";
      });
    };
  }, [media]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-2 sm:p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.25 }}
          onClick={(e) => e.stopPropagation()}
          className="glass relative flex h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl"
        >
          {/* La cruz vive en su propia franja, separada del video/foto —
              así nunca choca con el botón de calidad de YouTube ni nada
              que esté dentro del reproductor. */}
          <div className="flex shrink-0 items-center justify-between px-4 py-3">
            <span className="font-mono text-[11px] text-[var(--ink-muted)]">
              {media.length > 1 ? `${index + 1} / ${media.length}` : ""}
            </span>
            <button
              onClick={onClose}
              data-cursor="magnetic"
              aria-label="Cerrar"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/10 text-xl transition-colors hover:bg-black/20"
            >
              ×
            </button>
          </div>

          <div className="relative min-h-0 flex-1 bg-black">
            {current?.type === "video" && current.videoProvider && current.videoId ? (
              <div className="flex h-full items-center justify-center p-2 sm:p-6">
                <VideoEmbed provider={current.videoProvider} videoId={current.videoId} title={project.title} />
              </div>
            ) : current?.url ? (
              <Image
                src={`/api/media/${current.id}`}
                alt={project.title}
                fill
                className="object-contain"
                sizes="95vw"
                priority
                unoptimized
              />
            ) : null}

            {media.length > 1 && (
              <>
                <button
                  onClick={() => setIndex((i) => (i - 1 + media.length) % media.length)}
                  data-cursor="magnetic"
                  aria-label="Anterior"
                  className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white sm:left-4"
                >
                  ←
                </button>
                <button
                  onClick={() => setIndex((i) => (i + 1) % media.length)}
                  data-cursor="magnetic"
                  aria-label="Siguiente"
                  className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white sm:right-4"
                >
                  →
                </button>
              </>
            )}
          </div>

          {media.length > 1 && (
            <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto p-3">
              {media.map((m, i) => (
                <div key={m.id} className="flex shrink-0 items-center gap-1.5">
                  {labelForIndex.has(i) && (
                    <span className="ml-1 whitespace-nowrap font-mono text-[10px] text-[var(--ink-muted)]">
                      {labelForIndex.get(i)}
                    </span>
                  )}
                  <button
                    onClick={() => setIndex(i)}
                    data-cursor="magnetic"
                    className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md"
                    style={{ outline: i === index ? "2px solid var(--accent)" : "none" }}
                  >
                    {m.type === "image" ? (
                    <Image
                      src={`/api/media/${m.id}?w=160`}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="64px"
                      loading="eager"
                      unoptimized
                    />
                  ) : m.videoProvider && m.videoId && getVideoThumbnail(m.videoProvider, m.videoId) ? (
                    <div className="relative h-full w-full bg-black">
                      <Image
                        src={getVideoThumbnail(m.videoProvider, m.videoId)!}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="64px"
                        loading="eager"
                        unoptimized
                      />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/20 font-mono text-[10px] text-white">
                        ▶
                      </span>
                    </div>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-black/40 font-mono text-[8px] text-white">
                      ▶
                    </div>
                  )}
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="shrink-0 space-y-1 px-5 pb-5">
            <span className="font-mono text-[11px] text-accent">{project.role ?? "—"}</span>
            {project.dateLabel && (
              <span className="ml-2 font-mono text-[11px] text-[var(--ink-muted)]">{project.dateLabel}</span>
            )}
            <h2 className="font-display text-xl">{project.title}</h2>
            {project.description && (
              <p className="text-sm text-[var(--ink-muted)]">{project.description}</p>
            )}
            {project.collaboratorName && (
              <p className="font-mono text-[11px] text-[var(--ink-muted)]">
                con {project.collaboratorName}
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
