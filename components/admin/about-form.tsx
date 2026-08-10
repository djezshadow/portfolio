"use client";

import { useState } from "react";
import { markdownToHtml } from "@/lib/markdown";
import { SubmitButton } from "./submit-button";

type Props = {
  action: (formData: FormData) => Promise<void>;
  initial: {
    aboutEnabled: boolean;
    aboutTitle: string | null;
    aboutTitleEn: string | null;
    aboutContent: string | null;
    aboutContentEn: string | null;
    aboutCustomCss: string | null;
    aboutImageUrl: string | null;
  };
};

export function AboutForm({ action, initial }: Props) {
  const [content, setContent] = useState(initial.aboutContent ?? "");
  const [enabled, setEnabled] = useState(initial.aboutEnabled);

  return (
    <form action={action} className="space-y-6">
      <label className="flex items-center gap-2 font-mono text-sm">
        <input
          type="checkbox"
          name="aboutEnabled"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        Mostrar la sección "Sobre mí" en el sitio público (agrega el link en la nav)
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
            Título (Español) — vacío = "Sobre mí"
          </label>
          <input
            name="aboutTitle"
            defaultValue={initial.aboutTitle ?? ""}
            className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
            Título (English) — vacío = usa el español
          </label>
          <input
            name="aboutTitleEn"
            defaultValue={initial.aboutTitleEn ?? ""}
            className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
          Foto (opcional)
        </label>
        {initial.aboutImageUrl && (
          <div className="mb-2 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={initial.aboutImageUrl} alt="" className="h-16 w-16 rounded-xl object-cover" />
            <label className="flex items-center gap-2 font-mono text-[11px] text-[var(--ink-muted)]">
              <input type="checkbox" name="removeImage" /> Quitar foto
            </label>
          </div>
        )}
        <input type="file" name="image" accept="image/*" className="font-mono text-sm" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
            Contenido (Español) — Markdown: ## Subtítulo, - viñeta, 1. numerada, **negrita**
          </label>
          <textarea
            name="aboutContent"
            rows={16}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2 font-mono text-sm"
            placeholder={"## Quién soy\n\nUn párrafo contando algo.\n\n### Equipo de cámara\n- Cámara A\n- Cámara B\n\n1. Primer paso\n2. Segundo paso"}
          />
        </div>
        <div>
          <p className="mb-1 font-mono text-[11px] text-[var(--ink-muted)]">Previsualización en vivo</p>
          <div className="glass h-[26.5rem] overflow-y-auto rounded-lg p-4">
            <div className="about-content" dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }} />
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
          Contenido (English) — vacío = usa el español
        </label>
        <textarea
          name="aboutContentEn"
          rows={8}
          defaultValue={initial.aboutContentEn ?? ""}
          className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2 font-mono text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
          CSS personalizado (opcional, avanzado) — se inserta en un &lt;style&gt; propio de esta
          sección. Útil para cuando esto se venda como plantilla a otros clientes.
        </label>
        <textarea
          name="aboutCustomCss"
          rows={6}
          defaultValue={initial.aboutCustomCss ?? ""}
          className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2 font-mono text-xs"
          placeholder={".about-content h2 { color: hotpink; }"}
        />
      </div>

      <SubmitButton>Guardar cambios</SubmitButton>
    </form>
  );
}
