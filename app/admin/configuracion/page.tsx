import Image from "next/image";
import { getSiteSettings } from "@/lib/site-settings";
import { updateWatermarkSettings, updateHeroSettings } from "./actions";
import { getDictionary } from "@/lib/i18n/dictionaries";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  let settings = {
    watermarkUrl: null as string | null,
    watermarkScale: 9,
    heroTitle1: null as string | null,
    heroTitle1En: null as string | null,
    heroTitle2: null as string | null,
    heroTitle2En: null as string | null,
    heroSubtitle: null as string | null,
    heroSubtitleEn: null as string | null,
  };
  try {
    settings = await getSiteSettings();
  } catch (err) {
    console.error("No se pudo leer SiteSettings (¿corriste prisma db push?):", err);
  }

  const es = getDictionary("es");
  const en = getDictionary("en");

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="mb-8 font-display text-3xl">Configuración</h1>

      {/* --- Título / subtítulo de la home --- */}
      <h2 className="mb-1 font-display text-xl">Título y subtítulo de la home</h2>
      <p className="mb-4 text-sm text-[var(--ink-muted)]">
        Si dejás un campo vacío, se usa el texto actual (el que ves de placeholder).
      </p>
      <form action={updateHeroSettings} className="glass mb-10 space-y-4 rounded-2xl p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
              Título línea 1 (ES)
            </label>
            <input
              name="heroTitle1"
              defaultValue={settings.heroTitle1 ?? ""}
              placeholder={es.hero.title1}
              className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
              Título línea 1 (EN)
            </label>
            <input
              name="heroTitle1En"
              defaultValue={settings.heroTitle1En ?? ""}
              placeholder={en.hero.title1}
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
              defaultValue={settings.heroTitle2 ?? ""}
              placeholder={es.hero.title2}
              className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
              Título línea 2 (EN)
            </label>
            <input
              name="heroTitle2En"
              defaultValue={settings.heroTitle2En ?? ""}
              placeholder={en.hero.title2}
              className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
              Subtítulo (ES)
            </label>
            <textarea
              name="heroSubtitle"
              rows={2}
              defaultValue={settings.heroSubtitle ?? ""}
              placeholder={es.hero.subtitle}
              className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
              Subtítulo (EN)
            </label>
            <textarea
              name="heroSubtitleEn"
              rows={2}
              defaultValue={settings.heroSubtitleEn ?? ""}
              placeholder={en.hero.subtitle}
              className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
            />
          </div>
        </div>

        <button
          type="submit"
          data-cursor="magnetic"
          className="w-full rounded-full bg-[var(--accent)] py-3 font-mono text-sm text-[var(--bg)]"
        >
          Guardar título y subtítulo
        </button>
      </form>

      {/* --- Watermark --- */}
      <h2 className="mb-1 font-display text-xl">Watermark</h2>
      <p className="mb-4 text-sm text-[var(--ink-muted)]">
        Se aplica a las fotos nuevas que subas en cualquier proyecto (si lo dejás activado
        en el checkbox de esa pantalla).
      </p>

      <div className="glass mb-8 space-y-2 rounded-2xl p-5 font-mono text-xs text-[var(--ink-muted)]">
        <p className="font-mono text-xs text-accent">Cómo tiene que ser la imagen</p>
        <ul className="list-inside list-disc space-y-1">
          <li>Formato: <strong className="text-[var(--ink)]">PNG con fondo transparente</strong> (canal alpha). Si subís una foto sin transparencia, va a taparla como un rectángulo — usá tu logo/isotipo recortado, no una foto.</li>
          <li>Tamaño recomendado: cuadrado, entre <strong className="text-[var(--ink)]">500×500</strong> y <strong className="text-[var(--ink)]">1000×1000px</strong>. Si es más chico se puede ver pixelado en fotos grandes; si es más grande, lo redimensionamos igual a 1000×1000 al guardarlo.</li>
          <li>Contenido ideal: un isotipo o monograma simple (blanco o de un solo color sólido). Los logos con muchos detalles finos casi no se leen a los tamaños chicos que ocupa un watermark.</li>
          <li>Peso: no hay límite estricto, pero por debajo de 2MB va a subir más rápido.</li>
        </ul>
        <p className="pt-2 font-mono text-xs text-accent">Configuración extra</p>
        <ul className="list-inside list-disc space-y-1">
          <li><strong className="text-[var(--ink)]">Escala</strong>: qué porcentaje del ancho de la foto ocupa el watermark (por defecto 9%, como el ícono original).</li>
          <li>La <strong className="text-[var(--ink)]">opacidad</strong> y <strong className="text-[var(--ink)]">posición</strong> (esquina) se siguen eligiendo por foto, en la pantalla de cada proyecto — esto de acá solo define qué imagen se usa y su tamaño relativo.</li>
          <li>Si no subís nada, se usa el ícono de diafragma de cámara original.</li>
        </ul>
      </div>

      {settings.watermarkUrl && (
        <div className="glass mb-6 flex items-center gap-4 rounded-2xl p-4">
          <div className="relative h-20 w-20 shrink-0 rounded-lg bg-black/20">
            <Image src={settings.watermarkUrl} alt="Watermark actual" fill className="object-contain p-2" />
          </div>
          <p className="font-mono text-xs text-[var(--ink-muted)]">Logo personalizado activo</p>
        </div>
      )}

      <form action={updateWatermarkSettings} className="space-y-6">
        <div>
          <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
            {settings.watermarkUrl ? "Reemplazar logo" : "Subir logo (PNG transparente)"}
          </label>
          <input name="logo" type="file" accept="image/png" className="w-full font-mono text-sm" />
        </div>

        {settings.watermarkUrl && (
          <label className="flex items-center gap-2 font-mono text-sm">
            <input type="checkbox" name="removeLogo" /> Quitar el logo y volver al ícono de diafragma
          </label>
        )}

        <div>
          <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
            Escala (% del ancho de la foto)
          </label>
          <input
            type="number"
            name="watermarkScale"
            min={3}
            max={30}
            step={0.5}
            defaultValue={settings.watermarkScale}
            className="w-32 rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
          />
        </div>

        <button
          type="submit"
          data-cursor="magnetic"
          className="w-full rounded-full bg-[var(--accent)] py-3 font-mono text-sm text-[var(--bg)]"
        >
          Guardar configuración
        </button>
      </form>
    </div>
  );
}
