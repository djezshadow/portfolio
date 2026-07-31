import Image from "next/image";
import { getSiteSettings } from "@/lib/site-settings";
import { updateWatermarkSettings, updateHeroSettings, updateLogoSettings, updateContactSettings } from "./actions";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { WatermarkSettingsForm } from "@/components/admin/watermark-settings-form";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  let settings = {
    watermarkUrl: null as string | null,
    watermarkScale: 9,
    watermarkOpacity: 40,
    watermarkPosition: "bottom-right",
    heroTitle1: null as string | null,
    heroTitle1En: null as string | null,
    heroTitle2: null as string | null,
    heroTitle2En: null as string | null,
    heroSubtitle: null as string | null,
    heroSubtitleEn: null as string | null,
    carouselPreset: "cards",
    logoNoirUrl: null as string | null,
    logoNeonUrl: null as string | null,
    contactEmail: null as string | null,
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

      {/* --- Logo por tema --- */}
      <h2 className="mb-1 font-display text-xl">Logo (uno por tema)</h2>
      <p className="mb-4 text-sm text-[var(--ink-muted)]">
        Reemplaza el texto "DJEZSHADOW" en la nav — subí uno negro para Noir (fondo claro)
        y uno blanco para Neón (fondo oscuro). PNG con transparencia, horizontal, altura ideal ~120px.
      </p>
      <form action={updateLogoSettings} className="glass mb-10 grid grid-cols-1 gap-6 rounded-2xl p-5 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="font-mono text-[11px] text-[var(--ink-muted)]">Logo para Noir (claro) — subilo en negro</p>
          {settings.logoNoirUrl && (
            <div className="relative flex h-16 items-center justify-center rounded-lg bg-[#e9e4dc] p-2">
              <Image src={settings.logoNoirUrl} alt="Logo Noir" width={140} height={48} className="h-8 w-auto object-contain" />
            </div>
          )}
          <input name="logoNoir" type="file" accept="image/png" className="w-full font-mono text-xs" />
          {settings.logoNoirUrl && (
            <label className="flex items-center gap-2 font-mono text-xs">
              <input type="checkbox" name="removeNoirLogo" /> Quitar y volver al texto
            </label>
          )}
        </div>

        <div className="space-y-2">
          <p className="font-mono text-[11px] text-[var(--ink-muted)]">Logo para Neón (oscuro) — subilo en blanco</p>
          {settings.logoNeonUrl && (
            <div className="relative flex h-16 items-center justify-center rounded-lg bg-[#07070a] p-2">
              <Image src={settings.logoNeonUrl} alt="Logo Neón" width={140} height={48} className="h-8 w-auto object-contain" />
            </div>
          )}
          <input name="logoNeon" type="file" accept="image/png" className="w-full font-mono text-xs" />
          {settings.logoNeonUrl && (
            <label className="flex items-center gap-2 font-mono text-xs">
              <input type="checkbox" name="removeNeonLogo" /> Quitar y volver al texto
            </label>
          )}
        </div>

        <button
          type="submit"
          data-cursor="magnetic"
          className="col-span-full w-full rounded-full bg-[var(--accent)] py-3 font-mono text-sm text-[var(--bg)]"
        >
          Guardar logos
        </button>
      </form>

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

        <div>
          <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
            Estilo del carrusel de destacados
          </label>
          <select
            name="carouselPreset"
            defaultValue={settings.carouselPreset}
            className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
          >
            <option value="cards">Cards (tarjetas grandes, el original)</option>
            <option value="minimal">Minimal (lista prolija, sin tarjetas)</option>
            <option value="stack">Stack (círculos superpuestos)</option>
          </select>
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
          <li><strong className="text-[var(--ink)]">Escala, opacidad y posición</strong> se aplican al vuelo cada vez que se muestra una foto — no se "hornean" en el archivo. Cambiarlas acá actualiza automáticamente todas las fotos ya publicadas, sin re-subir nada.</li>
          <li>Por foto podés decidir si lleva watermark o no (al subirla), pero el logo/escala/opacidad/posición siempre son estos de acá.</li>
          <li>Si no subís nada, se usa el ícono de diafragma de cámara original.</li>
        </ul>
      </div>

      {settings.watermarkUrl && (
        <p className="mb-4 font-mono text-xs text-accent">Logo personalizado activo (se ve en la preview de abajo)</p>
      )}

      <form action={updateWatermarkSettings}>
        <WatermarkSettingsForm
          currentLogoUrl={settings.watermarkUrl}
          initialScale={settings.watermarkScale}
          initialOpacity={settings.watermarkOpacity}
          initialPosition={settings.watermarkPosition}
        />
      </form>

      {/* --- Contacto --- */}
      <h2 className="mb-1 mt-12 font-display text-xl">Contacto</h2>
      <p className="mb-4 text-sm text-[var(--ink-muted)]">
        A dónde llegan los mensajes confirmados de <code>/contacto</code>. Si lo dejás vacío,
        se usa <code>CONTACT_EMAIL_TO</code> del .env como respaldo.
      </p>
      <form action={updateContactSettings} className="glass space-y-4 rounded-2xl p-5">
        <div>
          <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
            Mail donde recibir los mensajes
          </label>
          <input
            type="email"
            name="contactEmail"
            defaultValue={settings.contactEmail ?? ""}
            placeholder="tu-mail@ejemplo.com"
            className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
          />
        </div>
        <button
          type="submit"
          data-cursor="magnetic"
          className="w-full rounded-full bg-[var(--accent)] py-3 font-mono text-sm text-[var(--bg)]"
        >
          Guardar mail de contacto
        </button>
      </form>
    </div>
  );
}
