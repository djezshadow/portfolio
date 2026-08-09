"use client";

import { useState } from "react";

export function LogoDisplayControls({
  previewUrl,
  initialFloating,
  initialSize,
  initialSizeMobile,
}: {
  previewUrl: string | null;
  initialFloating: boolean;
  initialSize: number;
  initialSizeMobile: number;
}) {
  const [floating, setFloating] = useState(initialFloating);
  const [size, setSize] = useState(initialSize);
  const [sizeMobile, setSizeMobile] = useState(initialSizeMobile);

  return (
    <div className="col-span-full space-y-4 border-t border-[var(--glass-border)] pt-5">
      <p className="font-mono text-[11px] text-[var(--ink-muted)]">
        Dónde y qué tan grande se ve el logo — se aplica tanto en Noir como en Neón.
      </p>

      <div className="flex flex-wrap gap-3">
        <label className="flex flex-1 min-w-[10rem] cursor-pointer items-start gap-2 rounded-xl border border-[var(--glass-border)] p-3">
          <input
            type="radio"
            name="logoFloating"
            value="false"
            checked={!floating}
            onChange={() => setFloating(false)}
            className="mt-1"
          />
          <span>
            <span className="block font-mono text-xs">Incrustado en la home</span>
            <span className="block font-mono text-[10px] text-[var(--ink-muted)]">
              Sin caja, arriba de la portada, más grande.
            </span>
          </span>
        </label>
        <label className="flex flex-1 min-w-[10rem] cursor-pointer items-start gap-2 rounded-xl border border-[var(--glass-border)] p-3">
          <input
            type="radio"
            name="logoFloating"
            value="true"
            checked={floating}
            onChange={() => setFloating(true)}
            className="mt-1"
          />
          <span>
            <span className="block font-mono text-xs">Flotante</span>
            <span className="block font-mono text-[10px] text-[var(--ink-muted)]">
              Fijo arriba a la izquierda con su cajita, como estaba.
            </span>
          </span>
        </label>
      </div>

      <div>
        <label className="mb-1 flex items-center justify-between font-mono text-[11px] text-[var(--ink-muted)]">
          <span>Tamaño en desktop (alto)</span>
          <span>{size}px</span>
        </label>
        <input
          type="range"
          name="logoSize"
          min={20}
          max={160}
          step={2}
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <label className="mb-1 flex items-center justify-between font-mono text-[11px] text-[var(--ink-muted)]">
          <span>Tamaño en celular (alto) — siempre centrado arriba, sin caja</span>
          <span>{sizeMobile}px</span>
        </label>
        <input
          type="range"
          name="logoSizeMobile"
          min={16}
          max={100}
          step={2}
          value={sizeMobile}
          onChange={(e) => setSizeMobile(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-[var(--ink-muted)]">
            Previsualización desktop
          </p>
          <div
            className={
              floating
                ? "nav-surface inline-flex items-center rounded-full px-4 py-3"
                : "flex items-center rounded-xl bg-black/10 px-6 py-6"
            }
          >
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Preview del logo" style={{ height: size }} className="w-auto object-contain" />
            ) : (
              <span className="font-display" style={{ fontSize: size * 0.55 }}>
                DJEZSHADOW
              </span>
            )}
          </div>
        </div>

        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-[var(--ink-muted)]">
            Previsualización celular (sin caja)
          </p>
          <div className="flex items-center justify-center rounded-xl bg-black/10 px-6 py-6">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Preview del logo mobile"
                style={{ height: sizeMobile }}
                className="w-auto object-contain"
              />
            ) : (
              <span className="font-display" style={{ fontSize: sizeMobile * 0.55 }}>
                DJEZSHADOW
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
