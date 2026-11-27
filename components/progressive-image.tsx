"use client";

import { useState } from "react";

export function ProgressiveImage({ src, alt, className, imgClassName, priority = false }: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
}) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  return (
    <div className={className} aria-busy={status === "loading"}>
      <img src={src} alt={alt} className={imgClassName} decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        onLoad={() => setStatus("loaded")} onError={() => setStatus("error")}
        style={{ visibility: status === "loaded" ? "visible" : "hidden" }} />
      {status !== "loaded" && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/20">
          {status === "error"
            ? <p role="status" className="text-sm text-white">No se pudo cargar la imagen.</p>
            : <span role="status" aria-label="Cargando imagen" className="h-8 w-8 rounded-full border-2 border-white/30 border-t-white motion-safe:animate-spin" />}
        </div>
      )}
    </div>
  );
}
