"use client";

import { useState } from "react";
import { SubmitButton } from "./submit-button";

type Props = {
  action: (formData: FormData) => Promise<void>;
  initial: {
    heroTitle1: string | null;
    heroTitle1En: string | null;
    heroTitle2: string | null;
    heroTitle2En: string | null;
    heroSubtitle: string | null;
    heroSubtitleEn: string | null;
    carouselPreset: string;
  };
  placeholders: {
    title1: string;
    title2: string;
    subtitle: string;
  };
};

export function HeroSettingsForm({ action, initial, placeholders }: Props) {
  const [title1, setTitle1] = useState(initial.heroTitle1 ?? "");
  const [title2, setTitle2] = useState(initial.heroTitle2 ?? "");
  const [subtitle, setSubtitle] = useState(initial.heroSubtitle ?? "");

  return (
    <form action={action} className="glass mb-10 space-y-4 rounded-2xl p-5">
      {/* Previsualización en vivo (item #15) — así se ve el hero de la home
          con estos textos, antes de guardar nada. */}
      <div className="rounded-xl bg-black/20 px-5 py-8">
        <span className="font-mono text-xs text-accent">REEL — 00:00:00:00</span>
        <h1 className="mt-2 font-display text-3xl leading-[1.05] sm:text-4xl">
          {title1 || placeholders.title1}
          <br />
          {title2 || placeholders.title2}
        </h1>
        <p className="mt-2 max-w-md font-body text-sm text-[var(--ink-muted)]">
          {subtitle || placeholders.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
            Título línea 1 (ES)
          </label>
          <input
            name="heroTitle1"
            value={title1}
            onChange={(e) => setTitle1(e.target.value)}
            placeholder={placeholders.title1}
            className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
            Título línea 1 (EN)
          </label>
          <input
            name="heroTitle1En"
            defaultValue={initial.heroTitle1En ?? ""}
            className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
            Título línea 2 (ES)
          </label>
          <input
            name="heroTitle2"
            value={title2}
            onChange={(e) => setTitle2(e.target.value)}
            placeholder={placeholders.title2}
            className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
            Título línea 2 (EN)
          </label>
          <input
            name="heroTitle2En"
            defaultValue={initial.heroTitle2En ?? ""}
            className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Subtítulo (ES)</label>
          <textarea
            name="heroSubtitle"
            rows={2}
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder={placeholders.subtitle}
            className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Subtítulo (EN)</label>
          <textarea
            name="heroSubtitleEn"
            rows={2}
            defaultValue={initial.heroSubtitleEn ?? ""}
            className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
          Estilo del carrusel de destacados
        </label>
        <select
          name="carouselPreset"
          defaultValue={initial.carouselPreset}
          className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
        >
          <option value="cards">Cards (tarjetas grandes, el original)</option>
          <option value="minimal">Minimal (lista prolija, sin tarjetas)</option>
          <option value="stack">Stack (círculos superpuestos)</option>
        </select>
      </div>

      <SubmitButton>Guardar título y subtítulo</SubmitButton>
    </form>
  );
}
