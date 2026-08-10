/**
 * Filtro invisible en el DOM, referenciado desde CSS con
 * backdrop-filter: url(#liquid-glass-distortion).
 * feTurbulence genera un mapa de ruido suave, feDisplacementMap lo usa
 * para "empujar" los píxeles del fondo — el mismo truco detrás de las
 * recreaciones en CSS del Liquid Glass de Apple: no es blur nada más,
 * es una distorsión real del contenido de atrás.
 */
export function LiquidGlassFilter() {
  return (
    <svg
      aria-hidden
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    >
      <filter id="liquid-glass-distortion" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.008 0.012"
          numOctaves="2"
          seed="7"
          result="noise"
        />
        <feGaussianBlur in="noise" stdDeviation="2.5" result="softNoise" />
        <feDisplacementMap
          in="SourceGraphic"
          in2="softNoise"
          scale="46"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  );
}
