"use client";

import { useMemo, useRef, useState } from "react";
import { SubmitButton } from "./submit-button";

type Position = "bottom-right" | "bottom-left" | "top-right" | "top-left" | "center";

const positionStyles: Record<Position, React.CSSProperties> = {
  "bottom-right": { bottom: "6%", right: "6%" },
  "bottom-left": { bottom: "6%", left: "6%" },
  "top-right": { top: "6%", right: "6%" },
  "top-left": { top: "6%", left: "6%" },
  center: { top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
};

/** Recreación liviana del ícono de diafragma para la preview (mismo look que lib/watermark.ts) */
function ApertureIcon({ size, opacity }: { size: number; opacity: number }) {
  const blades = 6;
  const cx = 50, cy = 50, outerR = 50, innerR = 11;
  const paths = Array.from({ length: blades }).map((_, i) => {
    const a0 = (i / blades) * Math.PI * 2;
    const a1 = ((i + 1) / blades) * Math.PI * 2;
    const x0 = cx + outerR * Math.cos(a0), y0 = cy + outerR * Math.sin(a0);
    const x1 = cx + outerR * Math.cos(a1), y1 = cy + outerR * Math.sin(a1);
    return `M ${cx} ${cy} L ${x0} ${y0} A ${outerR} ${outerR} 0 0 1 ${x1} ${y1} Z`;
  });
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx={cx} cy={cy} r={outerR - 1} fill="none" stroke="#fff" strokeOpacity={opacity} strokeWidth={1.5} />
      {paths.map((d, i) => (
        <path key={i} d={d} fill="#fff" fillOpacity={opacity} />
      ))}
    </svg>
  );
}

export function WatermarkSettingsForm({
  currentLogoUrl,
  initialScale,
  initialOpacity,
  initialPosition,
}: {
  currentLogoUrl: string | null;
  initialScale: number;
  initialOpacity: number;
  initialPosition: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewLogo, setPreviewLogo] = useState<string | null>(currentLogoUrl);
  const [scale, setScale] = useState(initialScale);
  const [opacity, setOpacity] = useState(initialOpacity);
  const [position, setPosition] = useState<Position>((initialPosition as Position) || "bottom-right");
  const [removeLogo, setRemoveLogo] = useState(false);

  const previewSize = useMemo(() => Math.round((scale / 100) * 260), [scale]);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewLogo(URL.createObjectURL(file));
      setRemoveLogo(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Preview en vivo — se actualiza al instante con cualquier control de abajo */}
      <div className="glass overflow-hidden rounded-2xl">
        <div
          className="relative aspect-video w-full"
          style={{
            background:
              "linear-gradient(135deg, #b9873f55, #17140f), radial-gradient(circle at 30% 30%, #7c5cff33, transparent)",
          }}
        >
          <span className="absolute left-3 top-3 font-mono text-[10px] text-white/60">
            Preview (foto de ejemplo)
          </span>
          {!removeLogo && (
            <div
              className="absolute"
              style={{ width: previewSize, height: previewSize, ...positionStyles[position] }}
            >
              {previewLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewLogo}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "contain", opacity: opacity / 100 }}
                />
              ) : (
                <ApertureIcon size={previewSize} opacity={opacity / 100} />
              )}
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
          {currentLogoUrl ? "Reemplazar logo" : "Subir logo (PNG o WebP, con fondo transparente)"}
        </label>
        <input
          ref={fileInputRef}
          name="logo"
          type="file"
          accept="image/png,image/webp"
          onChange={onFileChange}
          className="w-full font-mono text-sm"
        />
      </div>

      {currentLogoUrl && (
        <label className="flex items-center gap-2 font-mono text-sm">
          <input
            type="checkbox"
            name="removeLogo"
            checked={removeLogo}
            onChange={(e) => setRemoveLogo(e.target.checked)}
          />
          Quitar el logo y volver al ícono de diafragma
        </label>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
            Escala ({scale}%)
          </label>
          <input
            type="range"
            name="watermarkScale"
            min={3}
            max={60}
            step={0.5}
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
            Opacidad ({opacity}%)
          </label>
          <input
            type="range"
            name="watermarkOpacity"
            min={0}
            max={100}
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Posición</label>
          <select
            name="watermarkPosition"
            value={position}
            onChange={(e) => setPosition(e.target.value as Position)}
            className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
          >
            <option value="bottom-right">Abajo derecha</option>
            <option value="bottom-left">Abajo izquierda</option>
            <option value="top-right">Arriba derecha</option>
            <option value="top-left">Arriba izquierda</option>
            <option value="center">Centro</option>
          </select>
        </div>
      </div>

      <p className="font-mono text-[10px] text-[var(--ink-muted)]">
        Esto se aplica en el momento en que se muestra cada foto — <strong className="text-[var(--ink)]">no
        hace falta volver a subir nada</strong>. Cambiar esto acá actualiza todas las fotos ya
        publicadas (con watermark activado) en minutos.
      </p>

      <SubmitButton>Guardar watermark</SubmitButton>
    </div>
  );
}
