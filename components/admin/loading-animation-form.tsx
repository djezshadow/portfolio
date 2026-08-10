"use client";

import { useState } from "react";
import { SubmitButton } from "./submit-button";

const POSITIONS = [
  { value: "center", label: "Centro" },
  { value: "top-left", label: "Arriba izquierda" },
  { value: "top-right", label: "Arriba derecha" },
  { value: "bottom-left", label: "Abajo izquierda" },
  { value: "bottom-right", label: "Abajo derecha" },
];

const positionClasses: Record<string, string> = {
  center: "items-center justify-center",
  "top-left": "items-start justify-start p-3",
  "top-right": "items-start justify-end p-3",
  "bottom-left": "items-end justify-start p-3",
  "bottom-right": "items-end justify-end p-3",
};

export function LoadingAnimationForm({
  action,
  currentUrl,
  initial,
}: {
  action: (formData: FormData) => Promise<void>;
  currentUrl: string | null;
  initial: {
    position: string;
    positionMobile: string;
    size: number;
    sizeMobile: number;
  };
}) {
  const [position, setPosition] = useState(initial.position);
  const [positionMobile, setPositionMobile] = useState(initial.positionMobile);
  const [size, setSize] = useState(initial.size);
  const [sizeMobile, setSizeMobile] = useState(initial.sizeMobile);

  return (
    <form action={action} className="space-y-6">
      <p className="font-mono text-xs text-[var(--ink-muted)]">
        Jugá con esto como un "easter egg" — subí un gif o webp animado (se guarda tal cual, sin
        comprimir, para no perder la animación) y elegí dónde y qué tan grande se ve mientras el
        sitio carga la próxima página. Si no subís nada, se usa el spinner default.
      </p>

      <div>
        {currentUrl && (
          <div className="mb-2 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={currentUrl} alt="" className="h-16 w-16 rounded-lg bg-black/10 object-contain" />
            <label className="flex items-center gap-2 font-mono text-[11px] text-[var(--ink-muted)]">
              <input type="checkbox" name="removeImage" /> Quitar (vuelve al spinner default)
            </label>
          </div>
        )}
        <input type="file" name="file" accept="image/gif,image/webp" className="font-mono text-sm" />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-3">
          <p className="font-mono text-[11px] uppercase tracking-widest text-accent">Desktop</p>
          <select
            name="loadingAnimationPosition"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
          >
            {POSITIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <div>
            <label className="mb-1 flex items-center justify-between font-mono text-[11px] text-[var(--ink-muted)]">
              <span>Tamaño</span>
              <span>{size}px</span>
            </label>
            <input
              type="range"
              name="loadingAnimationSize"
              min={40}
              max={320}
              step={4}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-full"
            />
          </div>
          {/* marco tipo PC, 16:10 */}
          <div className={`flex aspect-[16/10] w-full rounded-lg bg-black/10 ${positionClasses[position]}`}>
            <div
              className="rounded bg-[var(--accent)]/30"
              style={{ width: size / 3, height: size / 3 }}
            />
          </div>
        </div>

        <div className="space-y-3">
          <p className="font-mono text-[11px] uppercase tracking-widest text-accent">Celular</p>
          <select
            name="loadingAnimationPositionMobile"
            value={positionMobile}
            onChange={(e) => setPositionMobile(e.target.value)}
            className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
          >
            {POSITIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <div>
            <label className="mb-1 flex items-center justify-between font-mono text-[11px] text-[var(--ink-muted)]">
              <span>Tamaño</span>
              <span>{sizeMobile}px</span>
            </label>
            <input
              type="range"
              name="loadingAnimationSizeMobile"
              min={30}
              max={220}
              step={4}
              value={sizeMobile}
              onChange={(e) => setSizeMobile(Number(e.target.value))}
              className="w-full"
            />
          </div>
          {/* marco tipo celular, 9:19 */}
          <div className={`mx-auto flex aspect-[9/19] w-24 rounded-xl bg-black/10 ${positionClasses[positionMobile]}`}>
            <div
              className="rounded bg-[var(--accent)]/30"
              style={{ width: sizeMobile / 3, height: sizeMobile / 3 }}
            />
          </div>
        </div>
      </div>

      <SubmitButton>Guardar animación de carga</SubmitButton>
    </form>
  );
}
