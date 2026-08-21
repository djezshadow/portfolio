"use client";

import { useState } from "react";
import { SubmitButton } from "./submit-button";
import { Carousel, type CarouselItem, type CarouselPreset } from "../carousel";

const SAMPLE_ITEMS: CarouselItem[] = [
  { id: "1", code: "SC-01", title: "Filmmaker", subtitle: "3 proyectos" },
  { id: "2", code: "SC-02", title: "Fotógrafo", subtitle: "5 proyectos" },
  { id: "3", code: "SC-03", title: "Animación 3D", subtitle: "2 proyectos" },
];

type Props = {
  action: (formData: FormData) => Promise<void>;
  initial: {
    heroTitle1: string | null;
    heroTitle1En: string | null;
    heroTitle2: string | null;
    heroTitle2En: string | null;
    heroSubtitle: string | null;
    heroSubtitleEn: string | null;
    heroKicker: string | null;
    heroKickerEn: string | null;
    heroKickerShowTimecode: boolean;
    carouselPreset: string;
    homeAlign: string;
    carouselItemSize: string;
    carouselGap: number;
    carouselBackground: string;
    carouselShadow: boolean;
    carouselGlass: boolean;
    carouselAlign: string;
  };
  placeholders: {
    title1: string;
    title2: string;
    subtitle: string;
  };
};

const ALIGN_CLASS: Record<string, string> = {
  left: "text-left items-start",
  center: "text-center items-center",
  right: "text-right items-end",
};

export function HeroSettingsForm({ action, initial, placeholders }: Props) {
  const [title1, setTitle1] = useState(initial.heroTitle1 ?? "");
  const [title2, setTitle2] = useState(initial.heroTitle2 ?? "");
  const [subtitle, setSubtitle] = useState(initial.heroSubtitle ?? "");
  const [kicker, setKicker] = useState(initial.heroKicker ?? "");
  const [showTimecode, setShowTimecode] = useState(initial.heroKickerShowTimecode);
  const [preset, setPreset] = useState<CarouselPreset>((initial.carouselPreset as CarouselPreset) || "cards");
  const [homeAlign, setHomeAlign] = useState(initial.homeAlign || "left");
  const [itemSize, setItemSize] = useState(initial.carouselItemSize || "md");
  const [gap, setGap] = useState(initial.carouselGap ?? 16);
  const [background, setBackground] = useState(initial.carouselBackground || "transparent");
  const [shadow, setShadow] = useState(initial.carouselShadow ?? false);
  const [glass, setGlass] = useState(initial.carouselGlass ?? true);
  const [align, setAlign] = useState(initial.carouselAlign || "left");

  return (
    <form action={action} className="glass mb-10 space-y-4 rounded-2xl p-5">
      {/* Previsualización en vivo (item #15) — así se ve el hero de la home
          con estos textos, antes de guardar nada. */}
      <div className={`flex flex-col rounded-xl bg-black/20 px-5 py-8 ${ALIGN_CLASS[homeAlign] ?? ALIGN_CLASS.left}`}>
        <span className="font-mono text-xs text-accent">
          {(kicker || "REEL").toUpperCase()}
          {showTimecode && " — 00:00:00:00"}
        </span>
        <h1 className="mt-2 font-display text-3xl leading-[1.05] sm:text-4xl">
          {title1 || placeholders.title1}
          <br />
          {title2 || placeholders.title2}
        </h1>
        <p className="mt-2 max-w-md font-body text-sm text-[var(--ink-muted)]">
          {subtitle || placeholders.subtitle}
        </p>
      </div>

      <div>
        <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
          Alineación de la home
        </label>
        <select
          name="homeAlign"
          value={homeAlign}
          onChange={(e) => setHomeAlign(e.target.value)}
          className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
        >
          <option value="left">Izquierda (como está ahora)</option>
          <option value="center">Centro</option>
          <option value="right">Derecha</option>
        </select>
        <p className="mt-1 font-mono text-[10px] text-[var(--ink-muted)]">
          Afecta el kicker/título/subtítulo del hero y los botones de abajo (Descargar reel/CV).
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

      <div className="rounded-xl border border-[var(--glass-border)] p-3">
        <p className="mb-2 font-mono text-[10px] text-[var(--ink-muted)]">
          La etiqueta chica arriba del título ("REEL — 00:00:00:00") es puramente decorativa —
          simula el timecode de un editor de video, para acompañar la estética de "cada corte
          cuenta algo". No tiene ninguna función, es solo texto de marca. La podés cambiar o
          apagar el timecode acá.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
              Palabra (ES) — vacío = "REEL"
            </label>
            <input
              name="heroKicker"
              value={kicker}
              onChange={(e) => setKicker(e.target.value)}
              className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
              Palabra (EN) — vacío = usa la ES
            </label>
            <input
              name="heroKickerEn"
              defaultValue={initial.heroKickerEn ?? ""}
              className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
            />
          </div>
        </div>
        <label className="mt-2 flex items-center gap-2 font-mono text-xs">
          <input
            type="checkbox"
            name="heroKickerShowTimecode"
            checked={showTimecode}
            onChange={(e) => setShowTimecode(e.target.checked)}
          />
          Mostrar "— 00:00:00:00" (siempre en ceros, es decorativo)
        </label>
      </div>

      <div>
        <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
          Estilo del carrusel de destacados
        </label>
        <select
          name="carouselPreset"
          value={preset}
          onChange={(e) => setPreset(e.target.value as CarouselPreset)}
          className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
        >
          <option value="cards">Cards (tarjetas grandes, el original)</option>
          <option value="minimal">Minimal (lista prolija, sin tarjetas)</option>
          <option value="stack">Stack (círculos superpuestos)</option>
          <option value="filmstrip">Filmstrip (tiras tipo negativo 35mm)</option>
          <option value="editorial">Editorial (grid asimétrico tipo revista)</option>
          <option value="marquee">Marquee (loop horizontal automático)</option>
          <option value="split">Split (imagen + panel de color, cortina al hover)</option>
          <option value="polaroid">Polaroid (fotos apiladas y rotadas)</option>
        </select>
      </div>

      <div className="rounded-xl border border-[var(--glass-border)] p-3">
        <p className="mb-2 font-mono text-[10px] text-[var(--ink-muted)]">
          Personalización fina del carrusel, por encima del estilo elegido arriba. Fondo/sombra/glass
          se notan sobre todo en Cards y Marquee — los demás presets (Polaroid, Filmstrip, Split,
          Stack) ya tienen su propia identidad visual y solo cambian de tamaño/separación.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Tamaño</label>
            <select
              name="carouselItemSize"
              value={itemSize}
              onChange={(e) => setItemSize(e.target.value)}
              className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
            >
              <option value="sm">Chico</option>
              <option value="md">Mediano (default)</option>
              <option value="lg">Grande</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
              Separación entre ítems ({gap}px)
            </label>
            <input
              type="range"
              name="carouselGap"
              min={0}
              max={48}
              value={gap}
              onChange={(e) => setGap(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Fondo</label>
            <select
              name="carouselBackground"
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
            >
              <option value="transparent">Transparente</option>
              <option value="surface">Superficie sólida</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
              Alineación del carrusel
            </label>
            <select
              name="carouselAlign"
              value={align}
              onChange={(e) => setAlign(e.target.value)}
              className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
            >
              <option value="left">Izquierda (default)</option>
              <option value="center">Centro</option>
              <option value="right">Derecha</option>
            </select>
            <p className="mt-1 font-mono text-[10px] text-[var(--ink-muted)]">
              Se nota más cuando hay pocos ítems y sobra espacio — con la fila llena de tarjetas
              (scroll horizontal) el efecto es mínimo, porque no queda aire libre para mover.
            </p>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-4">
          <label className="flex items-center gap-2 font-mono text-xs">
            <input
              type="checkbox"
              name="carouselShadow"
              checked={shadow}
              onChange={(e) => setShadow(e.target.checked)}
            />
            Sombra marcada
          </label>
          <label className="flex items-center gap-2 font-mono text-xs">
            <input
              type="checkbox"
              name="carouselGlass"
              checked={glass}
              onChange={(e) => setGlass(e.target.checked)}
            />
            Efecto glass (si se apaga, usa fondo sólido/transparente de arriba)
          </label>
        </div>
      </div>

      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-[var(--ink-muted)]">
          Previsualización (con datos de ejemplo)
        </p>
        <div className="overflow-hidden rounded-xl bg-black/20 p-5">
          <Carousel
            items={SAMPLE_ITEMS}
            preset={preset}
            style={{
              itemSize: itemSize as "sm" | "md" | "lg",
              gap,
              background: background as "transparent" | "surface",
              shadow,
              glass,
              align: align as "left" | "center" | "right",
            }}
          />
        </div>
      </div>

      <SubmitButton>Guardar título y subtítulo</SubmitButton>
    </form>
  );
}
