"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { VideoEmbed } from "./video-embed";

type MediaItem = {
  id: string;
  type: "image" | "video";
  url: string;
  videoProvider?: "youtube" | "vimeo" | null;
  videoId?: string | null;
};

type LightboxProject = {
  title: string;
  role: string | null;
  description: string | null;
  collaboratorName?: string | null;
  dateLabel?: string | null;
  media: MediaItem[];
};

export function ProjectLightbox({
  project,
  onClose,
}: {
  project: LightboxProject;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const media = project.media;
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

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 px-4 py-8"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.25 }}
          onClick={(e) => e.stopPropagation()}
          className="glass relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl"
        >
          <button
            onClick={onClose}
            data-cursor="magnetic"
            aria-label="Cerrar"
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-lg text-white"
          >
            ×
          </button>

          <div className="relative flex aspect-video w-full items-center justify-center bg-black">
            {current?.type === "video" && current.videoProvider && current.videoId ? (
              <VideoEmbed provider={current.videoProvider} videoId={current.videoId} title={project.title} />
            ) : current?.url ? (
              <Image
                src={current.url}
                alt={project.title}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 800px"
              />
            ) : null}

            {media.length > 1 && (
              <>
                <button
                  onClick={() => setIndex((i) => (i - 1 + media.length) % media.length)}
                  data-cursor="magnetic"
                  aria-label="Anterior"
                  className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white"
                >
                  ←
                </button>
                <button
                  onClick={() => setIndex((i) => (i + 1) % media.length)}
                  data-cursor="magnetic"
                  aria-label="Siguiente"
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white"
                >
                  →
                </button>
              </>
            )}
          </div>

          {media.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto p-3">
              {media.map((m, i) => (
                <button
                  key={m.id}
                  onClick={() => setIndex(i)}
                  data-cursor="magnetic"
                  className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md"
                  style={{ outline: i === index ? "2px solid var(--accent)" : "none" }}
                >
                  {m.type === "image" ? (
                    <Image src={m.url} alt="" fill className="object-cover" sizes="64px" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-black/40 font-mono text-[8px] text-white">
                      ▶
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-1 px-5 pb-5">
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
