"use client";

import { useEffect, useRef, useState } from "react";

/**
 * <img> con barra de progreso REAL de descarga (no un spinner genérico) —
 * pedido explícito: "Progreso de carga de fotos las quiero también en la
 * vista al público". Usa fetch + ReadableStream para ir sumando bytes
 * contra el Content-Length y arma un blob: URL cuando termina, en vez de
 * dejar que el navegador la cargue "a ciegas" con un <img src>.
 *
 * También sirve como warm-up de caché: si otra <ProgressiveImage> (o un
 * preload silencioso) ya pidió la misma URL antes, el fetch acá pega
 * contra la cache HTTP del navegador y el progreso salta prácticamente
 * directo al 100%.
 *
 * Importante: el componente que use esto NO debe disparar otro pedido
 * (ej. un <img> nativo o `new Image()`) a la MISMA URL al mismo tiempo —
 * el navegador puede unificar ambos pedidos en una sola conexión, y ahí
 * el progreso por bytes deja de reportarse de a poco.
 */
export function ProgressiveImage({
  src,
  alt,
  className,
  imgClassName,
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
}) {
  // null = todavía no sabemos el tamaño total (barra indeterminada);
  // número = % real ya calculado contra Content-Length.
  const [progress, setProgress] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const currentSrc = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    currentSrc.current = src;

    setLoaded(false);
    setFailed(false);
    setProgress(null);

    async function run() {
      try {
        const res = await fetch(src);
        if (!res.ok || !res.body) throw new Error("No se pudo cargar la imagen");

        const contentLength = Number(res.headers.get("Content-Length") ?? 0);
        const reader = res.body.getReader();
        let received = 0;

        // Solo leemos los bytes para medir el progreso real de descarga —
        // los descartamos (no armamos un blob: URL con ellos). Antes se
        // armaba un `URL.createObjectURL(blob)` y se usaba como src del
        // <img>, pero un blob: URL solo existe en la pestaña que lo creó:
        // por eso "abrir imagen en otra pestaña" (clic derecho del
        // navegador) mostraba una página rota/"código raro" en vez de la
        // foto — la pestaña nueva no tiene forma de resolver ese blob.
        // Ahora, al terminar, el <img> usa directamente la URL real
        // (`src`, la del endpoint comprimido/con marca de agua) — el
        // fetch de acá ya la dejó en la caché del navegador, así que no
        // se vuelve a descargar, y "abrir en pestaña nueva" funciona
        // porque es una URL http normal, no un blob.
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            received += value.length;
            if (contentLength > 0 && !cancelled) {
              setProgress(Math.min(100, Math.round((received / contentLength) * 100)));
            }
          }
        }

        if (cancelled || currentSrc.current !== src) return;
        setProgress(100);
        setLoaded(true);
      } catch {
        if (!cancelled && currentSrc.current === src) setFailed(true);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [src]);

  return (
    <div className={className}>
      {loaded && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className={imgClassName}
          fetchPriority={priority ? "high" : "auto"}
        />
      )}

      {!loaded && !failed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/20">
          <span
            aria-hidden
            style={{
              width: 32,
              height: 32,
              borderRadius: "9999px",
              border: "3px solid rgba(255,255,255,0.25)",
              borderTopColor: "#fff",
              animation: "djez-lightbox-spin 0.8s linear infinite",
            }}
          />
          <div className="w-32 space-y-1">
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/20">
              {progress !== null ? (
                <div
                  className="h-full rounded-full bg-white transition-[width] duration-150"
                  style={{ width: `${progress}%` }}
                />
              ) : (
                // No sabemos el tamaño total todavía (o el server no mandó
                // Content-Length) — igual mostramos movimiento para que
                // se vea que algo está pasando, en vez de una barra fija.
                <div
                  className="h-full w-1/3 rounded-full bg-white"
                  style={{ animation: "djez-lightbox-indeterminate 1.1s ease-in-out infinite" }}
                />
              )}
            </div>
            {progress !== null && (
              <p className="text-center font-mono text-[10px] text-white/70">{progress}%</p>
            )}
          </div>
          <style>{`
            @keyframes djez-lightbox-spin {
              to { transform: rotate(360deg); }
            }
            @keyframes djez-lightbox-indeterminate {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(300%); }
            }
          `}</style>
        </div>
      )}

      {failed && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <p className="font-mono text-xs text-white/70">No se pudo cargar la imagen</p>
        </div>
      )}
    </div>
  );
}
