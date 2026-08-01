"use client";

import { useState } from "react";

type VideoEmbedProps = {
  provider: "youtube" | "vimeo";
  videoId: string;
  title?: string;
};

/**
 * En vez de incrustar el iframe pesado de entrada, mostramos la miniatura
 * real (YouTube la sirve gratis por URL, sin API key) con un botón de play
 * encima, y solo montamos el iframe al click (item #12: lazy loading).
 * Suma: link para abrir en la app nativa (mobile) y "quality" del player
 * ya no choca con nuestra cruz de cerrar (esa vive afuera, en el lightbox).
 */
export function VideoEmbed({ provider, videoId, title = "Proyecto" }: VideoEmbedProps) {
  const [playing, setPlaying] = useState(false);

  const embedSrc =
    provider === "youtube"
      ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`
      : `https://player.vimeo.com/video/${videoId}?autoplay=1`;

  const watchUrl =
    provider === "youtube"
      ? `https://www.youtube.com/watch?v=${videoId}`
      : `https://vimeo.com/${videoId}`;

  const thumbnailUrl = provider === "youtube" ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;

  if (playing) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
        <iframe
          src={embedSrc}
          title={title}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
      <button
        onClick={() => setPlaying(true)}
        data-cursor="magnetic"
        className="absolute inset-0 flex items-center justify-center"
        aria-label={`Reproducir ${title}`}
        style={
          thumbnailUrl
            ? { backgroundImage: `url(${thumbnailUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
            : undefined
        }
      >
        <span className="absolute inset-0 bg-black/25 transition-colors hover:bg-black/10" />
        <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent)] text-xl text-[var(--bg)] shadow-lg">
          ▶
        </span>
      </button>

      <a
        href={watchUrl}
        target="_blank"
        rel="noopener noreferrer"
        data-cursor="magnetic"
        className="absolute bottom-3 left-4 rounded-full bg-black/50 px-3 py-1 font-mono text-[10px] text-white backdrop-blur-sm"
      >
        Abrir en {provider === "youtube" ? "YouTube" : "Vimeo"} ↗
      </a>
    </div>
  );
}
