"use client";

import { useState } from "react";

type VideoEmbedProps = {
  provider: "youtube" | "vimeo";
  videoId: string;
  title?: string;
};

/**
 * En vez de incrustar el iframe pesado de entrada, mostramos un botón de
 * play sobre glass y solo montamos el iframe real al click (item #12:
 * lazy loading; item #16: player con nuestra propia piel encima).
 */
export function VideoEmbed({ provider, videoId, title = "Proyecto" }: VideoEmbedProps) {
  const [playing, setPlaying] = useState(false);

  const src =
    provider === "youtube"
      ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`
      : `https://player.vimeo.com/video/${videoId}?autoplay=1`;

  if (playing) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-2xl">
        <iframe
          src={src}
          title={title}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setPlaying(true)}
      data-cursor="magnetic"
      className="glass relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl"
      aria-label={`Reproducir ${title}`}
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-lg text-[var(--bg)]">
        ▶
      </span>
      <span className="absolute bottom-3 left-4 font-mono text-[11px] text-[var(--ink-muted)]">
        {provider === "youtube" ? "YOUTUBE" : "VIMEO"}
      </span>
    </button>
  );
}
