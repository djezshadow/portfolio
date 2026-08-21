"use client";

import { useState } from "react";
import { CategoryThemeControl } from "./category-theme-control";
import { SubmitButton } from "./submit-button";

type CategoryFormProps = {
  action: (formData: FormData) => void;
  defaults?: {
    name?: string;
    nameEn?: string;
    order?: number;
    themeMode?: string;
    themeName?: string;
    metaTitle?: string;
    metaTitleEn?: string;
    metaDescription?: string;
    metaDescriptionEn?: string;
    isComingSoon?: boolean;
    comingSoonHint?: string;
    comingSoonHintEn?: string;
    easterEggMessage?: string;
    easterEggMessageEn?: string;
    showInNav?: boolean;
    accentColor?: string;
    fontFamily?: string;
    bold?: boolean;
    strikethrough?: boolean;
    alignment?: string;
    strokeWidth?: number | null;
    coverImageUrl?: string;
  };
  submitLabel?: string;
};

export function CategoryForm({ action, defaults = {}, submitLabel = "Guardar categoría" }: CategoryFormProps) {
  const [name, setName] = useState(defaults.name ?? "");
  const [accentColor, setAccentColor] = useState(defaults.accentColor || "#b9873f");
  const [fontFamily, setFontFamily] = useState(defaults.fontFamily || "display");
  const [bold, setBold] = useState(defaults.bold ?? false);
  const [strikethrough, setStrikethrough] = useState(defaults.strikethrough ?? false);
  const [alignment, setAlignment] = useState(defaults.alignment || "left");
  const [strokeWidth, setStrokeWidth] = useState(defaults.strokeWidth ?? 0);
  const [metaTitle, setMetaTitle] = useState(defaults.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(defaults.metaDescription ?? "");

  const fontClass = fontFamily === "mono" ? "font-mono" : fontFamily === "body" ? "font-body" : "font-display";
  const alignClass = alignment === "center" ? "text-center" : alignment === "right" ? "text-right" : "text-left";
  const previewTitle = name || "Nombre de la categoría";
  const seoTitle = metaTitle || `${previewTitle} — DJEZSHADOW`;
  const seoDescription = metaDescription || "Descripción autogenerada a partir del nombre de la categoría.";
  const siteUrl = "djezshadow.com";

  return (
    <form action={action} className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Nombre (Español)</label>
          <input
            name="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
            Nombre (English) — vacío = usa el español
          </label>
          <input
            name="nameEn"
            defaultValue={defaults.nameEn}
            className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
          Orden (menor número aparece primero)
        </label>
        <input
          type="number"
          name="order"
          defaultValue={defaults.order ?? 0}
          className="w-32 rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
        />
      </div>

      <CategoryThemeControl defaultMode={defaults.themeMode} defaultTheme={defaults.themeName} />

      <div className="glass space-y-3 rounded-2xl p-4">
        <p className="font-mono text-xs text-[var(--ink-muted)]">Estilo (item #22)</p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Color de acento</label>
            <input
              type="color"
              name="accentColor"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="h-9 w-full rounded"
            />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Tipografía</label>
            <select
              name="fontFamily"
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
            >
              <option value="display">Display (Fraunces)</option>
              <option value="body">Body (Geist Sans)</option>
              <option value="mono">Mono (Geist Mono)</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 font-mono text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="bold" checked={bold} onChange={(e) => setBold(e.target.checked)} /> Negrita
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="strikethrough"
              checked={strikethrough}
              onChange={(e) => setStrikethrough(e.target.checked)}
            />{" "}
            Tachado
          </label>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Alineación</label>
            <select
              name="alignment"
              value={alignment}
              onChange={(e) => setAlignment(e.target.value)}
              className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
            >
              <option value="left">Izquierda</option>
              <option value="center">Centro</option>
              <option value="right">Derecha</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
              Stroke (px, 0 = ninguno)
            </label>
            <input
              type="number"
              step="0.1"
              name="strokeWidth"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
            />
          </div>
        </div>

        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-[var(--ink-muted)]">
            Previsualización de estilo
          </p>
          <div className={`overflow-hidden rounded-xl bg-black/20 px-5 py-8 ${alignClass}`}>
            <h3
              className={`${fontClass} text-3xl ${bold ? "font-bold" : ""} ${strikethrough ? "line-through" : ""}`}
              style={{
                color: accentColor,
                WebkitTextStroke: strokeWidth > 0 ? `${strokeWidth}px ${accentColor}` : undefined,
              }}
            >
              {previewTitle}
            </h3>
          </div>
        </div>
      </div>

      <div className="glass space-y-3 rounded-2xl p-4">
        <p className="font-mono text-xs text-[var(--ink-muted)]">SEO manual (item #42) — opcional</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
              Título ES (ideal 50–60 caracteres; si lo dejás vacío se autogenera)
            </label>
            <input
              name="metaTitle"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              maxLength={70}
              className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
              Título EN — vacío = usa el ES
            </label>
            <input
              name="metaTitleEn"
              defaultValue={defaults.metaTitleEn}
              maxLength={70}
              className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
              Descripción ES (ideal 150–160 caracteres)
            </label>
            <textarea
              name="metaDescription"
              rows={2}
              maxLength={180}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
              Descripción EN — vacío = usa el ES
            </label>
            <textarea
              name="metaDescriptionEn"
              rows={2}
              maxLength={180}
              defaultValue={defaults.metaDescriptionEn}
              className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
            />
          </div>
        </div>

        {/* Preview de SEO manual (pendiente del PDF): así se ve el resultado
            en Google y el link cuando lo compartís por WhatsApp, con lo que
            escribiste arriba (o lo autogenerado si dejaste algo vacío). */}
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-[var(--ink-muted)]">
            Vista previa
          </p>

          <p className="mb-1 font-mono text-[10px] text-[var(--ink-muted)]">Como resultado de Google</p>
          <div className="mb-3 rounded-xl border border-[var(--glass-border)] bg-white p-4 text-black">
            <p className="truncate text-sm text-[#202124]">
              {siteUrl} › {previewTitle.toLowerCase().replace(/\s+/g, "-")}
            </p>
            <p className="truncate text-lg text-[#1a0dab]">{seoTitle}</p>
            <p className="line-clamp-2 text-sm text-[#4d5156]">{seoDescription}</p>
          </div>

          <p className="mb-1 font-mono text-[10px] text-[var(--ink-muted)]">Como link compartido en WhatsApp</p>
          <div className="max-w-sm overflow-hidden rounded-lg border border-[#2a3942] bg-[#202c33] text-white">
            {defaults.coverImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={defaults.coverImageUrl} alt="" className="h-32 w-full object-cover" />
            )}
            <div className="space-y-0.5 border-l-4 border-[#25d366] bg-[#182229] p-2.5">
              <p className="truncate text-sm font-medium">{seoTitle}</p>
              <p className="line-clamp-2 text-xs text-[#8696a0]">{seoDescription}</p>
              <p className="text-xs text-[#8696a0]">{siteUrl}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass space-y-3 rounded-2xl p-4">
        <label className="flex items-center gap-2 font-mono text-sm">
          <input type="checkbox" name="showInNav" defaultChecked={defaults.showInNav} /> Mostrar en el
          navbar flotante del sitio (útil para linkear una categoría "coming soon" sin que salga en destacados)
        </label>
      </div>

      <div className="glass space-y-3 rounded-2xl p-4">
        <label className="flex items-center gap-2 font-mono text-sm">
          <input type="checkbox" name="isComingSoon" defaultChecked={defaults.isComingSoon} /> Categoría
          en pausa — aparece gris/bloqueada en destacados y en el navbar, con un mensaje al tocarla
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
              Pista ES (se muestra en el popup del home/navbar — si no la cargás, usa un texto genérico)
            </label>
            <input
              name="comingSoonHint"
              defaultValue={defaults.comingSoonHint}
              className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
              Pista EN — vacío = usa la ES
            </label>
            <input
              name="comingSoonHintEn"
              defaultValue={defaults.comingSoonHintEn}
              className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
            />
          </div>
        </div>

        <div className="border-t border-[var(--glass-border)] pt-3">
          <p className="mb-2 font-mono text-[11px] text-[var(--ink-muted)]">
            Mensaje del easter egg (independiente de la pista de arriba) — solo lo ve quien entra
            por la URL directa de esta categoría y toca 6 veces el signo de pregunta.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
                Mensaje secreto ES
              </label>
              <input
                name="easterEggMessage"
                defaultValue={defaults.easterEggMessage}
                className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
                Mensaje secreto EN — vacío = usa el ES
              </label>
              <input
                name="easterEggMessageEn"
                defaultValue={defaults.easterEggMessageEn}
                className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
              />
            </div>
          </div>
        </div>
      </div>

      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
