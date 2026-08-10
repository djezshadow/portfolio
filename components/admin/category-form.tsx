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
    showInNav?: boolean;
    accentColor?: string;
    fontFamily?: string;
    bold?: boolean;
    strikethrough?: boolean;
    alignment?: string;
    strokeWidth?: number | null;
  };
  submitLabel?: string;
};

export function CategoryForm({ action, defaults = {}, submitLabel = "Guardar categoría" }: CategoryFormProps) {
  return (
    <form action={action} className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Nombre (Español)</label>
          <input
            name="name"
            required
            defaultValue={defaults.name}
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
              defaultValue={defaults.accentColor || "#b9873f"}
              className="h-9 w-full rounded"
            />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Tipografía</label>
            <select
              name="fontFamily"
              defaultValue={defaults.fontFamily || "display"}
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
            <input type="checkbox" name="bold" defaultChecked={defaults.bold} /> Negrita
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="strikethrough" defaultChecked={defaults.strikethrough} /> Tachado
          </label>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Alineación</label>
            <select
              name="alignment"
              defaultValue={defaults.alignment || "left"}
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
              defaultValue={defaults.strokeWidth ?? 0}
              className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
            />
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
              defaultValue={defaults.metaTitle}
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
              defaultValue={defaults.metaDescription}
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
          incógnita (item #47) — no aparece en destacados, muestra "coming soon" con easter egg
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
              Pista ES (si no la cargás, usa un texto genérico)
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
      </div>

      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
