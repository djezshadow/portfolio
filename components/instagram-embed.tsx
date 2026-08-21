"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

/// Un solo post/reel embebido con el widget PÚBLICO de Instagram
/// (embed.js) — no usa la Graph API, no necesita token ni cuenta
/// business vinculada: alcanza con que el post sea público. El script
/// se carga una sola vez para toda la página (ver InstagramFeed).
export function InstagramEmbedItem({ url, caption }: { url: string; caption?: string | null }) {
  const ref = useRef<HTMLQuoteElement>(null);

  useEffect(() => {
    window.instgrm?.Embeds.process();
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl">
      <blockquote
        ref={ref}
        className="instagram-media"
        data-instgrm-permalink={url}
        data-instgrm-version="14"
        style={{ margin: 0, width: "100%" }}
      />
      {caption && <p className="mt-2 font-mono text-xs text-[var(--ink-muted)]">{caption}</p>}
    </div>
  );
}

/// Carga embed.js una única vez y re-procesa los embeds nuevos que
/// vayan apareciendo (por ejemplo al cambiar de sección Feed/Destacadas).
export function InstagramEmbedScript() {
  useEffect(() => {
    if (document.getElementById("instagram-embed-script")) {
      window.instgrm?.Embeds.process();
      return;
    }
    const script = document.createElement("script");
    script.id = "instagram-embed-script";
    script.src = "https://www.instagram.com/embed.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return null;
}
