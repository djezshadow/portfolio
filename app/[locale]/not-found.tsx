import Link from "next/link";
import { defaultLocale } from "@/lib/i18n/dictionaries";
import { getSiteSettings } from "@/lib/site-settings";

/**
 * Pedido: "hacer una página error 404" y después "poder editar mi
 * página error 404, para cambiar diseño, textos y hasta poner una
 * imagen" — se edita desde /admin/error-404. Vive dentro de
 * app/[locale]/ porque el middleware siempre agrega el prefijo de
 * idioma antes de que una ruta pueda no existir, así que un 404 real
 * siempre cae acá adentro, heredando el navbar y el footer normales.
 *
 * Next.js no le pasa los params de la ruta a este archivo especial, así
 * que en vez de adivinar el idioma mostramos los dos juntos por
 * default — evita mostrar el mensaje en el idioma equivocado. Si
 * cargaste texto personalizado, se muestra ese en los dos idiomas tal
 * cual lo escribiste (uno debajo del otro, si pusiste los dos).
 */
export default async function NotFound() {
  let settings: {
    notFoundTitle: string | null;
    notFoundTitleEn: string | null;
    notFoundMessage: string | null;
    notFoundMessageEn: string | null;
    notFoundImageUrl: string | null;
  } | null = null;

  try {
    settings = await getSiteSettings();
  } catch {
    // sin DB disponible, seguimos con el texto por defecto
  }

  const hasCustomText = Boolean(settings?.notFoundTitle || settings?.notFoundMessage);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 text-center">
      <span className="mb-4 font-mono text-xs text-accent">404 — SC-∅∅</span>

      {settings?.notFoundImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={settings.notFoundImageUrl}
          alt=""
          className="mb-6 max-h-64 w-full max-w-sm rounded-2xl object-cover"
        />
      )}

      {hasCustomText ? (
        <>
          <h1 className="mb-4 font-display text-4xl sm:text-5xl">
            {settings?.notFoundTitle}
            {settings?.notFoundTitleEn && (
              <>
                <br />
                <span className="text-[var(--ink-muted)]">{settings.notFoundTitleEn}</span>
              </>
            )}
          </h1>
          {settings?.notFoundMessage && (
            <p className="mb-2 max-w-md font-body text-[var(--ink-muted)]">{settings.notFoundMessage}</p>
          )}
          {settings?.notFoundMessageEn && (
            <p className="mb-8 max-w-md font-body text-[var(--ink-muted)]">{settings.notFoundMessageEn}</p>
          )}
        </>
      ) : (
        <>
          <h1 className="mb-4 font-display text-4xl sm:text-5xl">
            Escena no encontrada
            <br />
            <span className="text-[var(--ink-muted)]">Scene not found</span>
          </h1>
          <p className="mb-2 max-w-md font-body text-[var(--ink-muted)]">
            Esta toma no quedó en el corte final — el link puede estar roto o la página ya no
            existe.
          </p>
          <p className="mb-8 max-w-md font-body text-[var(--ink-muted)]">
            This shot didn&apos;t make the final cut — the link may be broken or the page no
            longer exists.
          </p>
        </>
      )}

      <Link
        href={`/${defaultLocale}`}
        data-cursor="magnetic"
        className="glass inline-block rounded-full px-6 py-2.5 font-mono text-sm"
      >
        Volver al inicio / Back home
      </Link>
    </div>
  );
}

