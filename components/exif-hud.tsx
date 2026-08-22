"use client";

/**
 * HUD tipo visor de cámara de cine — el "cuadrito con esquinas y datos
 * técnicos" que se ve en los viewfinders al grabar. Pedido: "me imaginé
 * cuando ves los visores de cámaras de cine cuando graban que aparecen
 * los detalles de la cámara". Solo se muestra si la foto tiene al menos
 * un dato EXIF cargado a mano — nunca se inventa nada.
 */
export function ExifHud({
  camera,
  aperture,
  shutterSpeed,
  iso,
  fps,
}: {
  camera?: string | null;
  aperture?: string | null;
  shutterSpeed?: string | null;
  iso?: string | null;
  fps?: string | null;
}) {
  const hasAny = camera || aperture || shutterSpeed || iso || fps;
  if (!hasAny) return null;

  const corner = "absolute h-4 w-4 border-white/70";

  return (
    <div className="pointer-events-none absolute inset-3 sm:inset-6" aria-hidden>
      {/* Esquinas del visor */}
      <div className={`${corner} left-0 top-0 border-l-2 border-t-2`} />
      <div className={`${corner} right-0 top-0 border-r-2 border-t-2`} />
      <div className={`${corner} bottom-0 left-0 border-b-2 border-l-2`} />
      <div className={`${corner} bottom-0 right-0 border-b-2 border-r-2`} />

      {/* Punto rojo de "grabando" arriba a la izquierda */}
      <div className="absolute left-4 top-2 flex items-center gap-1.5 sm:left-8 sm:top-4">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
        {camera && <span className="font-mono text-[10px] tracking-wide text-white/80 sm:text-xs">{camera}</span>}
      </div>

      {/* Datos técnicos, abajo, estilo readout de cámara de cine */}
      <div className="absolute bottom-2 left-4 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[10px] text-white/70 sm:bottom-4 sm:left-8 sm:text-xs">
        {aperture && <span>{aperture}</span>}
        {shutterSpeed && <span>{shutterSpeed}s</span>}
        {iso && <span>ISO {iso}</span>}
        {fps && <span>{fps}fps</span>}
      </div>
    </div>
  );
}
