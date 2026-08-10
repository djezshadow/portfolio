"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { VideoEmbed } from "./video-embed";
import { getVideoThumbnail } from "@/lib/video-url";
import { ProgressiveImage } from "./progressive-image";

// Ancho tope para la vista grande del lightbox. Antes se pedía la imagen
// a resolución ORIGINAL (podía ser 6000px+ de una cámara) — eso hacía que
// el server tuviera que procesar y mandar un archivo enorme cada vez.
// 2000px ya se ve nítido a pantalla completa y es mucho más rápido de
// generar (watermark incluido) y de transferir.
const LIGHTBOX_WIDTH = 2000;

type MediaItem = {
  id: string;
  type: "image" | "video";
  url: string;
  videoProvider?: "youtube" | "vimeo" | null;
  videoId?: string | null;
  groupId?: string | null;
  bakedThumbUrl?: string | null;
  bakedFullUrl?: string | null;
};

type MediaGroupInfo = { id: string; name: string; coverImageUrl?: string | null };

type LightboxProject = {
  title: string;
  role: string | null;
  description: string | null;
  collaboratorName?: string | null;
  dateLabel?: string | null;
  media: MediaItem[];
  /// Subcategorías del proyecto (item #13), ya en el orden en que se
  /// definieron. Si hay al menos una, el lightbox arranca mostrando un
  /// selector de subcategorías en vez de ir directo a las fotos.
  groups?: MediaGroupInfo[];
};

/// Reordena la media agrupándola por subcategoría (en el orden de
/// `groups`), dejando la que no tiene grupo al final. Devuelve también,
/// por cada índice, el nombre de grupo a mostrar como separador (solo en
/// el primer ítem de cada grupo). Se usa en el modo "todas las fotos".
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
  const groups = project.groups ?? [];
  // null = mostrando el selector de subcategorías (item #13: "que se
  // creen como un cuadro nuevo"). "all" = viendo todas las fotos juntas.
  // Un id = viendo solo esa subcategoría. Si el proyecto no tiene
  // subcategorías, arranca directo en "all" — comportamiento de siempre.
  const [activeGroupId, setActiveGroupId] = useState<string | "all" | null>(
    groups.length > 0 ? null : "all"
  );
  const [index, setIndex] = useState(0);

  function selectGroup(id: string | "all") {
    setActiveGroupId(id);
    setIndex(0);
  }

  const rawMedia = activeGroupId === "all" || activeGroupId === null
    ? project.media
    : project.media.filter((m) => m.groupId === activeGroupId);
  const { ordered: media, labelForIndex } = groupMedia(
    rawMedia,
    activeGroupId === "all" ? groups : []
  );
  const current = media[index];
  const showingPicker = activeGroupId === null;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (showingPicker) return;
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
  }, [media.length, onClose, showingPicker]);

  // Precarga: solo las dos fotos VECINAS (anterior/siguiente) — la actual
  // no, porque de eso ya se encarga <ProgressiveImage> con su propio
  // fetch(). Precargarla acá TAMBIÉN generaba un segundo pedido a la
  // misma URL al mismo tiempo; el navegador los unifica en uno solo y
  // eso rompía el progreso por bytes (llegaba todo junto al final en vez
  // de ir subiendo de a poco). No competimos con el proyecto entero,
  // solo con los dos pasos posibles de "siguiente/anterior".
  useEffect(() => {
    if (showingPicker) return;
    const neighborOffsets = [1, -1];
    const preloaded: HTMLImageElement[] = [];
    for (const offset of neighborOffsets) {
      const m = media[(index + offset + media.length) % media.length];
      if (!m) continue;
      if (m.type === "image") {
        const img = new window.Image();
        img.src = m.bakedFullUrl || `/api/media/${m.id}?w=${LIGHTBOX_WIDTH}`;
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
  }, [media, index, showingPicker]);

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
            {showingPicker ? (
              <span className="font-mono text-[11px] text-[var(--ink-muted)]">
                {project.title}
              </span>
            ) : (
              <div className="flex items-center gap-3">
                {groups.length > 0 && (
                  <button
                    onClick={() => setActiveGroupId(null)}
                    data-cursor="magnetic"
                    className="font-mono text-[11px] text-[var(--ink-muted)] underline"
                  >
                    ← Subcategorías
                  </button>
                )}
                <span className="font-mono text-[11px] text-[var(--ink-muted)]">
                  {media.length > 1 ? `${index + 1} / ${media.length}` : ""}
                </span>
              </div>
            )}
            <button
              onClick={onClose}
              data-cursor="magnetic"
              aria-label="Cerrar"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/10 text-xl transition-colors hover:bg-black/20"
            >
              ×
            </button>
          </div>

          {showingPicker ? (
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">
              <h2 className="mb-4 font-display text-xl">{project.title}</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {groups.map((g) => {
                  const groupMediaList = project.media.filter((m) => m.groupId === g.id);
                  const fallbackCover =
                    groupMediaList.find((m) => m.type === "image")?.bakedThumbUrl ||
                    (groupMediaList[0] ? `/api/media/${groupMediaList[0].id}?w=800` : null);
                  const cover = g.coverImageUrl || fallbackCover;
                  return (
                    <button
                      key={g.id}
                      onClick={() => selectGroup(g.id)}
                      data-cursor="magnetic"
                      className="group text-left"
                    >
                      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black/20">
                        {cover && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={cover}
                            alt={g.name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        )}
                      </div>
                      <p className="mt-2 font-mono text-sm">{g.name}</p>
                      <p className="font-mono text-[10px] text-[var(--ink-muted)]">
                        {groupMediaList.length} foto{groupMediaList.length !== 1 ? "s" : ""}
                      </p>
                    </button>
                  );
                })}

                {project.media.some((m) => !m.groupId) && (
                  <button
                    onClick={() => selectGroup("all")}
                    data-cursor="magnetic"
                    className="group text-left"
                  >
                    <div className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-black/20">
                      <span className="font-mono text-xs text-[var(--ink-muted)]">Ver todo</span>
                    </div>
                    <p className="mt-2 font-mono text-sm">Todas las fotos</p>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <motion.div
                className="relative min-h-0 flex-1 touch-pan-y bg-black"
                drag={media.length > 1 ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.6}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -60 || info.velocity.x < -500) {
                    setIndex((i) => (i + 1) % media.length);
                  } else if (info.offset.x > 60 || info.velocity.x > 500) {
                    setIndex((i) => (i - 1 + media.length) % media.length);
                  }
                }}
              >
                {current?.type === "video" && current.videoProvider && current.videoId ? (
                  <div className="flex h-full items-center justify-center p-2 sm:p-6">
                    <VideoEmbed provider={current.videoProvider} videoId={current.videoId} title={project.title} />
                  </div>
                ) : current?.url ? (
                  <ProgressiveImage
                    key={current.id}
                    src={current.bakedFullUrl || `/api/media/${current.id}?w=${LIGHTBOX_WIDTH}`}
                    alt={project.title}
                    priority
                    className="absolute inset-0"
                    imgClassName="h-full w-full object-contain"
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
              </motion.div>

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
                            src={m.bakedThumbUrl || `/api/media/${m.id}?w=160`}
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
            </>
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
