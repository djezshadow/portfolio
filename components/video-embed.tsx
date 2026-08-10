"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { getVideoThumbnail } from "@/lib/video-url";

type VideoEmbedProps = {
  provider: "youtube" | "vimeo";
  videoId: string;
  title?: string;
};

/**
 * En vez de incrustar el iframe pesado de entrada, mostramos la miniatura
 * real (YouTube la sirve gratis por URL, sin API key) con un botón de play
 * encima, y solo montamos el iframe al click (item #12: lazy loading).
 * Suma: link para abrir en la app nativa (mobile), y detección de video
 * vertical (Shorts) vía oEmbed para no dejar bordes negros en mobile —
 * en PC se queda siempre en 16:9 (no importa la orientación real).
 */
export function VideoEmbed({ provider, videoId, title = "Proyecto" }: VideoEmbedProps) {
  const [playing, setPlaying] = useState(false);
  const [isVertical, setIsVertical] = useState(false);

  useEffect(() => {
    if (provider !== "youtube") return;
    let cancelled = false;
    fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.height && data?.width && data.height > data.width) {
          setIsVertical(true);
        }
      })
      .catch(() => {
        // si falla, seguimos asumiendo horizontal (comportamiento de siempre)
      });
    return () => {
      cancelled = true;
    };
  }, [provider, videoId]);

  const embedSrc =
    provider === "youtube"
      ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`
      : `https://player.vimeo.com/video/${videoId}?autoplay=1`;

  const watchUrl =
    provider === "youtube"
      ? `https://www.youtube.com/watch?v=${videoId}`
      : `https://vimeo.com/${videoId}`;

  const thumbnailUrl = getVideoThumbnail(provider, videoId);

  // En mobile, un video vertical (Short) se adapta por altura en vez de
  // ancho — así no quedan franjas negras a los costados. En desktop (sm+)
  // siempre 16:9, como pediste ("en PC da igual").
  const frameClass = clsx(
    "relative overflow-hidden rounded-2xl bg-black",
    isVertical ? "h-full aspect-[9/16] max-w-full sm:h-auto sm:w-full sm:aspect-video sm:max-w-none" : "w-full aspect-video max-h-full"
  );

  if (playing) {
    return (
      <div className={frameClass}>
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
    <div className={frameClass}>
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
